from fastapi import APIRouter,Depends,HTTPException,status
from sqlalchemy.orm  import Session
import models,utils,schemas,oauth
from database import get_db
from sqlalchemy.exc import IntegrityError



router = APIRouter(
    tags=["Users"],
    prefix = "/users"
)


@router.post("/", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def create_users (user:schemas.UserCreate,db:Session = Depends(get_db)):
    new_user = user.model_dump()  # make the user a dict
    new_user["password"] = utils.get_password_hash()
    new_user_obj = models.User(**new_user)
    try:
        db.add(new_user_obj)
        db.commit()
        db.refresh(new_user_obj)
    except IntegrityError: # if user alrady exist 
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already exist"
        )
    return new_user_obj

@router.get("/me")
def get_me(current_user:models.Users=Depends(oauth.get_current_user)):
    return current_user





    

   
    
   
    
