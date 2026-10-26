from fastapi import APIRouter, Depends, HTTPException, status
from .. import models, schemas, oauth
from ..database import get_db
from sqlalchemy.orm import Session
from typing import List
from ..split_expense import calculate_splits


router = APIRouter(
    tags=["Expenses"],
    prefix="/expenses"
)


def _build_expense_detail(expense: models.Expenses, db: Session) -> schemas.GetExpenseDetail:
    splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == expense.id).all()
    payer = db.query(models.Users).filter(models.Users.id == expense.paid_by).first()
    group = db.query(models.Groups).filter(models.Groups.id == expense.group_id).first() if expense.group_id else None

    split_outs = []
    for s in splits:
        u = db.query(models.Users).filter(models.Users.id == s.user_id).first()
        split_outs.append(schemas.SplitOut(
            user_id=s.user_id,
            amount_owed=s.amount_owed,
            is_settled=s.is_settled,
            username=u.username if u else None,
            email=u.email if u else None
        ))

    return schemas.GetExpenseDetail(
        id=expense.id,
        group_id=expense.group_id,
        paid_by=expense.paid_by,
        paid_by_name=payer.username if payer else None,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        created_at=expense.created_at,
        group_name=group.name if group else None,
        splits=split_outs
    )


# list all expenses for the current user
@router.get("/", response_model=List[schemas.GetExpenseDetail])
def get_my_expenses(
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user)
):
    split_expense_ids = [
        s.expense_id for s in db.query(models.ExpenseSplit.expense_id).filter(
            models.ExpenseSplit.user_id == current_user.id
        ).all()
    ]

    expenses = db.query(models.Expenses).filter(
        (models.Expenses.paid_by == current_user.id) |
        (models.Expenses.id.in_(split_expense_ids))
    ).order_by(models.Expenses.created_at.desc()).all()

    return [_build_expense_detail(exp, db) for exp in expenses]


# list all expenses in a group
@router.get("/{id}/expenses", response_model=List[schemas.GetExpenseDetail])
def list_all_group_expense(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user)
):
    # does group id exist?
    group = db.query(models.Groups).filter(models.Groups.id == id).first()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )
    # is the person a current member
    is_member = db.query(models.GroupMembers).filter(
        models.GroupMembers.group_id == id,
        models.GroupMembers.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this group"
        )

    expenses = db.query(models.Expenses).filter(models.Expenses.group_id == id).order_by(models.Expenses.created_at.desc()).all()
    return [_build_expense_detail(exp, db) for exp in expenses]


# expense detail (including split breakdown)
@router.get("/{id}", response_model=schemas.GetExpenseDetail)
def get_expense(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user)
):
    expense = db.query(models.Expenses).filter(models.Expenses.id == id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if expense.group_id is not None:
        is_member = db.query(models.GroupMembers).filter(
            models.GroupMembers.group_id == expense.group_id,
            models.GroupMembers.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not a member"
            )
    else:
        # personal expense — check if payer or in splits
        is_split_user = db.query(models.ExpenseSplit).filter(
            models.ExpenseSplit.expense_id == expense.id,
            models.ExpenseSplit.user_id == current_user.id
        ).first()
        if expense.paid_by != current_user.id and not is_split_user:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    return _build_expense_detail(expense, db)


@router.post("/", response_model=schemas.GetExpenseDetail, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense: schemas.CreateExpense,
    db: Session = Depends(get_db),
    current_user: models.Users = Depends(oauth.get_current_user)
):
    # if it's a group expense, verify group + membership
    if expense.group_id is not None:
        group = db.query(models.Groups).filter(models.Groups.id == expense.group_id).first()
        if not group:
            raise HTTPException(status_code=404, detail="Group not found")

        is_member = db.query(models.GroupMembers).filter(
            models.GroupMembers.group_id == expense.group_id,
            models.GroupMembers.user_id == current_user.id
        ).first()
        if not is_member:
            raise HTTPException(status_code=403, detail="Not a member of this group")

    # If splits are not provided:
    splits_to_use = expense.splits or []
    if not splits_to_use:
        if expense.group_id is not None:
            # default: split equally among all members of the group
            members = db.query(models.GroupMembers).filter(models.GroupMembers.group_id == expense.group_id).all()
            splits_to_use = [schemas.SplitInput(user_id=m.user_id) for m in members]
        else:
            # default: personal expense for the payer
            splits_to_use = [schemas.SplitInput(user_id=current_user.id)]

    # validate no duplicate user_ids
    user_ids = [s.user_id for s in splits_to_use]
    if len(user_ids) != len(set(user_ids)):
        raise HTTPException(status_code=400, detail="Duplicate users in split")

    split_type = expense.split_type or schemas.SplitType.equal

    # calculate splits (raises ValueError if exact/percentage don't add up)
    try:
        calculated_splits = calculate_splits(expense.amount, split_type, splits_to_use)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # create the expense row
    new_expense = models.Expenses(
        group_id=expense.group_id,
        paid_by=current_user.id,
        amount=expense.amount,
        description=expense.description or "Expense",
        category=expense.category or "food"
    )
    db.add(new_expense)
    db.flush()  # gets new_expense.id without committing yet

    # create the split rows, tied to that expense
    for split in calculated_splits:
        db.add(models.ExpenseSplit(
            expense_id=new_expense.id,
            user_id=split["user_id"],
            amount_owed=split["amount_owed"],
            is_settled=False
        ))

    db.commit()
    db.refresh(new_expense)
    return _build_expense_detail(new_expense, db)
