from sqlalchemy import Column, String, Integer, DateTime, DECIMAL, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=False, unique=True)
    password = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Groups(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    creator = relationship("Users")


class GroupMembers(Base):
    __tablename__ = "gMembers"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Groups")
    user = relationship("Users")


class Expenses(Base):
    __tablename__ = "expense"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)
    paid_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Groups")
    payer = relationship("Users")


class ExpenseSplit(Base):
    __tablename__ = "splits"

    id = Column(Integer, primary_key=True)
    expense_id = Column(Integer, ForeignKey("expense.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount_owed = Column(DECIMAL(10, 2), nullable=False)
    is_settled = Column(Boolean, nullable=False, server_default="false")

    expense = relationship("Expenses")
    user = relationship("Users")


class Payments(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=True)
    paid_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    paid_to = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    provider = Column(String, nullable=True)              # "momo" or "stripe"
    provider_reference_id = Column(String, nullable=True) # the UUID from request_to_pay
    status = Column(String, nullable=False, server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# class Balances(Base):
#     __tablename__ = "balances"

#     id = Column(Integer, primary_key=True)
#     user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#     owes_to_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
#     amount = Column(DECIMAL(10, 2), nullable=False)

#     user = relationship("Users", foreign_keys=[user_id])
#     owed_to = relationship("Users", foreign_keys=[owes_to_user_id])


class Invitation(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id", ondelete="CASCADE"), nullable=False)
    invited_email = Column(String, nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, nullable=False, server_default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    group = relationship("Groups")
    inviter = relationship("Users")