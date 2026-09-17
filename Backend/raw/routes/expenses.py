from fastapi import APIRouter,Depends,HTTPException,status
from .. import models,schemas,oauth
from ..database import get_db
from sqlalchemy.orm import Session
from typing import List
from ..split_expense import calculate_splits


router = APIRouter(
    tags=["Expenses"],
    prefix="/expenses"
)



# list all expenses in a group
@router.get("/{id}/expenses",response_model=List[schemas.PostExpense])
def list_all_group_expense(
    id:int,
    db:Session = Depends(get_db),
    current_user:models.Users= Depends(oauth.get_current_user)
):
    # does group id exist?
    group = db.query(models.Groups).filter(models.Groups.id == id).all()
    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found"
        )
    # is the person a current member
    is_member = db.query(models.GroupMembers).filter(
        models.GroupMembers.group_id == id,
        models.GroupMembers.user_id == current_user.id
    ).first()
    if not is_member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a memeber"
        )
    
    # now actually query expenses belonging to this group
    expenses = db.query(models.Expenses).filter(models.Expenses.group_id == id).all()
    return expenses

# expense detail (including split breakdown)
@router.get("/{id}",response_model=schemas.GetExpenseDetail)
def get_expense(
    id:int,
    db:Session = Depends(get_db),
    current_user:models.Users= Depends(oauth.get_current_user)
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
                detail="Not a memeber"
            )
    else:
        # personal expense — only the payer can view it (adjust if the other party should too)
        if expense.paid_by != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == id).all()
    return schemas.GetExpenseDetail(
        id=expense.id,
        group_id=expense.group_id,
        paid_by=expense.paid_by,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        created_at=expense.created_at,
        splits=splits
    )



    
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

    # validate no duplicate user_ids
    user_ids = [s.user_id for s in expense.splits]
    if len(user_ids) != len(set(user_ids)):
        raise HTTPException(status_code=400, detail="Duplicate users in split")

    # calculate splits (raises ValueError if exact/percentage don't add up)
    try:
        calculated_splits = calculate_splits(expense.amount, expense.split_type, expense.splits)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # create the expense row
    new_expense = models.Expenses(
        group_id=expense.group_id,
        paid_by=current_user.id,
        amount=expense.amount,
        description=expense.description,
        category=expense.category
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
    splits = db.query(models.ExpenseSplit).filter(models.ExpenseSplit.expense_id == new_expense.id).all()
    return schemas.GetExpenseDetail(
        id=new_expense.id,
        group_id=new_expense.group_id,
        paid_by=new_expense.paid_by,
        amount=new_expense.amount,
        description=new_expense.description,
        category=new_expense.category,
        created_at=new_expense.created_at,
        splits=splits
    )
    