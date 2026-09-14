from sqlalchemy import Column, String, Integer,DateTime
from .database import Base
from sqlalchemy.sql import func





class Users(Base):
    __tablename__ = "users"

    id = Column(Integer,primary_key=True)
    username = Column(String,unique=True,nullable=False)
    email = Column(String,nullable=False,unique=True)
    password = Column(String,nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
