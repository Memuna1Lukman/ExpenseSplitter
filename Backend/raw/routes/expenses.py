from fastapi import APIRouter,Depends,HTTPException,status
from .. import models,schemas,oauth
from ..database import get_db
from sqlalchemy.orm import Session
from typing import List

router = APIRouter(
    tags=["Expenses"],
    prefix="/expenses"
)

# add expense to a group
@router.post("/groups/{id}/expenses",response_model=schemas.PostExpense,status_code=status.HTTP_201_CREATED)
def create_expense(expense:schemas.CreateExpense,db:Session = Depends(get_db),current_user:models.Users = Depends(oauth.get_current_user)):
    new_expense = expense.model_dump()
    # check if the gropu exist
    if expense.group_id is not None:
        check_group = db.query(models.Groups).filter(models.Groups.id == expense.group_id).first()
        if not check_group:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Group Not Found")
        check_member = db.query(models.GroupMembers).filter(
            models.GroupMembers.group_id == expense.group_id,
            models.GroupMembers.user_id == expense.paid_by
        ).first()
    if not check_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail="Not Authourised")
        
    add_expense = models.Expenses(**new_expense)
    db.addd(add_expense)
    db.commit()
    db.refresh(add_expense)
    return add_expense



    
