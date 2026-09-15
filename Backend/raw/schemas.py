from pydantic import BaseModel,EmailStr
from typing import Optional
from datetime import datetime


class TokenData(BaseModel):
    id: Optional[int]= None



class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr

    class Config:
        from_attributes = True  # lets Pydantic read from the ORM object    

class CreateGroup(BaseModel):
    name: str
    description: str
    created_by: int

class PostGroup(BaseModel):
    id: int
    name: str
    description: str
    created_by: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True  # lets Pydantic read from the ORM object 

class GetAllGroups(BaseModel):
    id: int
    name: str
    description: str
    created_by: int
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True  # lets Pydantic read from the ORM object          

class GetOneGroup(GetAllGroups):
    pass

class AddMembers(BaseModel):
    group_id : int
    user_id:  int


class PostMembers(BaseModel):
    id: int
    group_id : int
    user_id:  int
    joined_at: Optional[datetime] = None
    class Config:
        from_attributes = True  # lets Pydantic read from the ORM object
        

