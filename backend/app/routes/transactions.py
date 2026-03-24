from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from typing import Optional

from ..database import get_db
from ..models import Transaction, Category, Merchant

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


def serialize_transaction(t: Transaction) -> dict:
    return {
        "id": t.id,
        "date": t.date.isoformat(),
        "merchant": t.merchant_rel.name,
        "merchant_id": t.merchant_id,
        "amount": t.amount,
        "category": t.category_rel.name,
        "category_id": t.category_id,
        "description": t.description,
        "type": t.type,
    }


@router.get("")
def get_transactions(
    db: Session = Depends(get_db),
    category: Optional[str] = None,
    days: int = Query(default=90, ge=1, le=365),
):
    cutoff = date.today() - timedelta(days=days)
    q = db.query(Transaction).join(Transaction.category_rel).join(Transaction.merchant_rel)
    q = q.filter(Transaction.date >= cutoff)
    if category:
        q = q.filter(Category.name == category)
    rows = q.order_by(Transaction.date.desc()).all()
    return [serialize_transaction(t) for t in rows]


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    today = date.today()
    month_start = today.replace(day=1)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)

    all_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "income"
    ).scalar() or 0

    all_expenses = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "expense"
    ).scalar() or 0

    monthly_spending = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "expense",
        Transaction.date >= month_start,
    ).scalar() or 0

    monthly_income = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "income",
        Transaction.date >= month_start,
    ).scalar() or 0

    last_month_spending = db.query(func.sum(Transaction.amount)).filter(
        Transaction.type == "expense",
        Transaction.date >= last_month_start,
        Transaction.date < month_start,
    ).scalar() or 0

    balance = all_income - all_expenses
    savings_rate = ((monthly_income - monthly_spending) / monthly_income * 100) if monthly_income > 0 else 0

    return {
        "balance": round(balance, 2),
        "monthly_spending": round(monthly_spending, 2),
        "monthly_income": round(monthly_income, 2),
        "last_month_spending": round(last_month_spending, 2),
        "savings_rate": round(savings_rate, 1),
    }


@router.get("/by-category")
def get_by_category(
    db: Session = Depends(get_db),
    days: int = 30,
    month: Optional[str] = None,
):
    q = (
        db.query(Category.name, func.sum(Transaction.amount))
        .join(Transaction.category_rel)
        .filter(Transaction.type == "expense")
    )
    if month:
        q = q.filter(func.strftime("%Y-%m", Transaction.date) == month)
    else:
        cutoff = date.today() - timedelta(days=days)
        q = q.filter(Transaction.date >= cutoff)
    rows = q.group_by(Category.name).all()
    return [{"category": name, "total": round(total, 2)} for name, total in rows]


@router.get("/by-merchant")
def get_by_merchant(db: Session = Depends(get_db), days: int = 30, limit: int = 10):
    """Top merchants by total spend and visit count — powers vendor analysis."""
    cutoff = date.today() - timedelta(days=days)
    rows = (
        db.query(
            Merchant.name,
            Category.name,
            func.sum(Transaction.amount),
            func.count(Transaction.id),
        )
        .join(Transaction.merchant_rel)
        .join(Transaction.category_rel)
        .filter(Transaction.type == "expense", Transaction.date >= cutoff)
        .group_by(Merchant.name, Category.name)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "merchant": name,
            "category": cat,
            "total_spent": round(total, 2),
            "visit_count": count,
            "avg_per_visit": round(total / count, 2),
        }
        for name, cat, total, count in rows
    ]


@router.get("/monthly-trend")
def get_monthly_trend(db: Session = Depends(get_db)):
    rows = (
        db.query(
            func.strftime("%Y-%m", Transaction.date).label("month"),
            Transaction.type,
            func.sum(Transaction.amount),
        )
        .group_by("month", Transaction.type)
        .order_by("month")
        .all()
    )
    trend = {}
    for month, tx_type, total in rows:
        if month not in trend:
            trend[month] = {"month": month, "income": 0, "expenses": 0}
        if tx_type == "income":
            trend[month]["income"] = round(total, 2)
        else:
            trend[month]["expenses"] = round(total, 2)
    return list(trend.values())


@router.post("")
def add_transaction(
    merchant: str,
    amount: float,
    category: str,
    description: str = "",
    tx_type: str = "expense",
    tx_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Find or create the merchant and category
    cat = db.query(Category).filter(Category.name == category).first()
    if not cat:
        cat = Category(name=category)
        db.add(cat)
        db.flush()

    merch = db.query(Merchant).filter(Merchant.name == merchant).first()
    if not merch:
        merch = Merchant(name=merchant)
        db.add(merch)
        db.flush()

    tx = Transaction(
        date=date.fromisoformat(tx_date) if tx_date else date.today(),
        merchant_id=merch.id,
        amount=amount,
        category_id=cat.id,
        description=description,
        type=tx_type,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return serialize_transaction(tx)
