import base64
import json
from fastapi import APIRouter, UploadFile, File, Depends, Request
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from ..models import Transaction, Category, Merchant
from ..llm_service import analyze_image

router = APIRouter(prefix="/api/scanner", tags=["scanner"])

RECEIPT_PROMPT = """Analyze this receipt image and extract the following information.
Return ONLY a valid JSON object with these fields:
- "merchant": store/restaurant name
- "date": date in YYYY-MM-DD format (use today's date if not visible)
- "total": total amount as a number (no $ sign)
- "items": array of {"name": string, "price": number}
- "suggested_category": one of: Groceries, Dining, Shopping, Health, Entertainment, Transport, Utilities, Subscriptions

If you cannot read a field clearly, make your best guess based on context.
Return ONLY valid JSON, no markdown or code blocks."""


@router.post("/scan")
async def scan_receipt(file: UploadFile = File(...)):
    contents = await file.read()

    mime = file.content_type or "image/jpeg"
    try:
        raw = analyze_image(contents, mime, RECEIPT_PROMPT)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        result = json.loads(cleaned)
        return result
    except Exception as e:
        return {"error": str(e)}


@router.post("/confirm")
async def confirm_receipt(request: Request, db: Session = Depends(get_db)):
    """Save each line item from a scanned receipt as a separate transaction."""
    body = await request.json()
    merchant_name = body["merchant"]
    category_name = body["category"]
    tx_date_str = body.get("date")
    items = body.get("items", [])
    total = body.get("total", 0)

    cat = db.query(Category).filter(Category.name == category_name).first()
    if not cat:
        cat = Category(name=category_name)
        db.add(cat)
        db.flush()

    merch = db.query(Merchant).filter(Merchant.name == merchant_name).first()
    if not merch:
        merch = Merchant(name=merchant_name)
        db.add(merch)
        db.flush()

    tx_date = date.fromisoformat(tx_date_str) if tx_date_str else date.today()
    created = []

    if items:
        for item in items:
            item_cat_name = item.get("category") or category_name
            item_cat = db.query(Category).filter(Category.name == item_cat_name).first()
            if not item_cat:
                item_cat = Category(name=item_cat_name)
                db.add(item_cat)
                db.flush()
            tx = Transaction(
                date=tx_date,
                merchant_id=merch.id,
                amount=round(float(item["price"]), 2),
                category_id=item_cat.id,
                description=item.get("name", "Receipt item"),
                type="expense",
            )
            db.add(tx)
            db.flush()
            created.append({
                "id": tx.id,
                "merchant": merch.name,
                "amount": tx.amount,
                "category": item_cat.name,
                "date": tx_date.isoformat(),
                "description": tx.description,
            })
    else:
        tx = Transaction(
            date=tx_date,
            merchant_id=merch.id,
            amount=round(float(total), 2),
            category_id=cat.id,
            description=f"Receipt scan - {merchant_name}",
            type="expense",
        )
        db.add(tx)
        db.flush()
        created.append({
            "id": tx.id,
            "merchant": merch.name,
            "amount": tx.amount,
            "category": cat.name,
            "date": tx_date.isoformat(),
            "description": tx.description,
        })

    db.commit()
    return {"transactions_created": len(created), "transactions": created}
