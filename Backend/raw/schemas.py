from decimal import Decimal
from enum import Enum
from pydantic import BaseModel,EmailStr
from typing import List, Optional
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
        

# class CreateExpense(BaseModel):
#     group_id: int
#     paid_by: int
#     amount:int
#     description: str
#     category:str


class CreateExpenseOne(BaseModel):
    amount:int
    description: str
    category:str

class PostExpense(BaseModel):
    id: int
    group_id: int
    paid_by: int
    amount:int
    description: str
    category:str   
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True  # lets Pydantic read from the ORM object

class PostExpenseOne(BaseModel):
    id:int
    paid_by: int
    amount: int
    description: str
    category:str   
    created_at: Optional[datetime] = None
    class Config:
        from_attributes = True  # lets Pydantic read from the ORM object

class SplitType(str, Enum):
    equal = "equal"
    exact = "exact"
    percentage = "percentage"

class SplitInput(BaseModel):
    user_id: int
    value: Optional[Decimal] = None
    # for "equal": value is ignored, can be omitted
    # for "exact": value = amount owed
    # for "percentage": value = percentage (e.g. 30 for 30%)


class CreateExpense(BaseModel):
    group_id: Optional[int] = None
    amount: Decimal
    description: Optional[str] = None
    category: Optional[str] = None
    split_type: SplitType
    splits: List[SplitInput]  # who is involved, and their value if exact/percentage

class SplitOut(BaseModel):
    user_id: int
    amount_owed: Decimal
    is_settled: bool

    class Config:
        from_attributes = True

class GetExpenseDetail(BaseModel):
    id: int
    group_id: int | None
    paid_by: int
    amount: Decimal
    description: str | None
    category: str | None
    created_at: datetime
    splits: List[SplitOut]

    class Config:
        from_attributes = True

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetSubmit(BaseModel):
    token: str
    new_password: str

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp: str    


class BalanceOut(BaseModel):
    from_user: int
    to_user: int
    amount: Decimal


class InitiateMomoPayment(BaseModel):
    group_id: Optional[int] = None
    paid_to: int
    amount: Decimal
    phone_number: str   # the payer's MoMo number (use a MTN test number for now)
    note: Optional[str] = None


class PaymentOut(BaseModel):
    id: int
    group_id: Optional[int]
    paid_by: int
    paid_to: int
    amount: Decimal
    provider: Optional[str]
    provider_reference_id: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True    