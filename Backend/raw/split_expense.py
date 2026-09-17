from decimal import Decimal,ROUND_HALF_UP
from typing import List
from . import schemas,models
from collections import defaultdict
from sqlalchemy.orm import Session
from .database import get_db
from fastapi import Depends


def calculate_splits(amount:Decimal,split_type:schemas.SplitType,splits:List[schemas.SplitInput])->List[dict]:
    n = len(splits)
    if split_type == schemas.SplitType.equal:
        base_share = (amount/n).quantize(Decimal("0.01"),rounding=ROUND_HALF_UP)
        total_so_far = base_share*n
        remainder_cents = int(amount - total_so_far)/ Decimal("0.01")


        results = []
        for i,s in enumerate(splits):
            share = base_share
            if i<remainder_cents:
                share+=Decimal("0.01")
                results.append({"user_id": s.user_id, "amount_owed": share})
        return results
    elif split_type == schemas.SplitType.exact:
        total = sum(s.value for s in splits)
        if total != amount:
            raise ValueError(f"Exact amounts ({total}) don't sum to total expense ({amount})")
        return [{"user_id": s.user_id, "amount_owed": s.value} for s in splits]
    elif split_type == schemas.SplitType.percentage:
        total = sum(s.value for s in splits)
        if total != 100:
            raise ValueError(f"Percentages sum to {total}, must be 100")
        return [
            {
                "user_id": s.user_id,
                "amount_owed": (amount * s.value / 100).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            }
            for s in splits
        ]



def get_group_balances(group_id:int,db:Session = Depends(get_db)):
    # net[(ower_id, owed_to_id)] = amount ower owes owed_to
    net = defaultdict(Decimal)



    # Step A: go through every unsettled split in this group's expenses
    splits = (
        db.query(models.ExpenseSplit,models.Expenses)
        .join(models.Expenses,models.ExpenseSplit.expense_id == models.Expenses.id)
        .filter(models.Expenses.group_id == group_id)
        .filter(models.ExpenseSplit.is_settled == False)
        .all()
    )
    for split,expense in splits:
        ower = split.user_id
        payer = expense.paid_by
        if ower == payer:
            continue
        net[(ower, payer)] += split.amount_owed


    # Step B: subtract direct payments already made in this group
    payments = db.query(models.Payments).filter(models.Payments.group_id == group_id).all()
    for p in payments:
        net[(p.paid_by, p.paid_to)] -= p.amount

    return net

def simplify_balances(net: dict) -> list[dict]:
    seen = set()
    result = []

    for (a,b), amount in net.items():
        if (a,b) in seen or (b,a) in seen:
            continue
        seen.add((a, b))
        seen.add((b, a))
        reverse_amount = net.get((b, a), Decimal("0"))
        final = amount - reverse_amount  # net owed from a to b
        if final > 0:
            result.append({"from_user": a, "to_user": b, "amount": final})
        elif final < 0:
            result.append({"from_user": b, "to_user": a, "amount": -final})
        # if final == 0, they're settled up — skip

    return result    



