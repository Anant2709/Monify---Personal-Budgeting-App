from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    transactions = relationship("Transaction", back_populates="category_rel")


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    transactions = relationship("Transaction", back_populates="merchant_rel")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    merchant_id = Column(Integer, ForeignKey("merchants.id"), nullable=False)
    amount = Column(Float, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    description = Column(String, default="")
    type = Column(String, default="expense")  # "expense" or "income"

    merchant_rel = relationship("Merchant", back_populates="transactions")
    category_rel = relationship("Category", back_populates="transactions")
