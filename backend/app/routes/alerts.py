from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
import json

from ..database import get_db
from ..models import Transaction, Category, Merchant
from ..llm_service import generate_text

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


def detect_anomalies(db: Session) -> list[dict]:
    today = date.today()
    current_start = today - timedelta(days=30)
    prev_start = today - timedelta(days=60)

    current = (
        db.query(Transaction)
        .join(Transaction.category_rel)
        .join(Transaction.merchant_rel)
        .filter(Transaction.type == "expense", Transaction.date >= current_start)
        .all()
    )
    previous = (
        db.query(Transaction)
        .join(Transaction.category_rel)
        .join(Transaction.merchant_rel)
        .filter(
            Transaction.type == "expense",
            Transaction.date >= prev_start,
            Transaction.date < current_start,
        )
        .all()
    )

    curr_cats = {}
    for t in current:
        name = t.category_rel.name
        curr_cats[name] = curr_cats.get(name, 0) + t.amount

    prev_cats = {}
    for t in previous:
        name = t.category_rel.name
        prev_cats[name] = prev_cats.get(name, 0) + t.amount

    anomalies = []

    for cat, curr_total in curr_cats.items():
        prev_total = prev_cats.get(cat, 0)
        if prev_total > 0:
            pct_change = ((curr_total - prev_total) / prev_total) * 100
            if pct_change > 30:
                anomalies.append({
                    "type": "category_spike",
                    "category": cat,
                    "current": round(curr_total, 2),
                    "previous": round(prev_total, 2),
                    "pct_change": round(pct_change, 1),
                })

    large_txns = [t for t in current if t.amount > 100]
    for t in sorted(large_txns, key=lambda x: x.amount, reverse=True)[:3]:
        cat_name = t.category_rel.name
        avg_for_cat = curr_cats.get(cat_name, 0) / max(
            len([x for x in current if x.category_rel.name == cat_name]), 1
        )
        if t.amount > avg_for_cat * 2:
            anomalies.append({
                "type": "large_transaction",
                "merchant": t.merchant_rel.name,
                "amount": round(t.amount, 2),
                "category": cat_name,
                "date": t.date.isoformat(),
                "avg_for_category": round(avg_for_cat, 2),
            })

    prev_merchants = {t.merchant_rel.name for t in previous}
    seen_new = set()
    for t in current:
        m_name = t.merchant_rel.name
        if m_name not in prev_merchants and m_name not in seen_new:
            seen_new.add(m_name)
            if len(seen_new) <= 3:
                anomalies.append({
                    "type": "new_merchant",
                    "merchant": m_name,
                    "amount": round(t.amount, 2),
                    "category": t.category_rel.name,
                })

    return anomalies


ALERT_PROMPT = """You are a helpful budget assistant. Generate friendly, actionable alert messages for the following spending anomalies.

Anomalies detected:
{anomalies}

Return a JSON array of objects, each with:
- "severity": "high", "medium", or "low"
- "title": a short headline (4-7 words)
- "message": a friendly, specific 1-2 sentence alert with dollar amounts
- "suggestion": a brief actionable tip

Return ONLY valid JSON, no markdown or code blocks."""


@router.get("")
def get_alerts(db: Session = Depends(get_db)):
    anomalies = detect_anomalies(db)
    if not anomalies:
        return []

    prompt = ALERT_PROMPT.format(anomalies=json.dumps(anomalies, indent=2))
    try:
        raw = generate_text(prompt)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        return json.loads(cleaned)
    except Exception as e:
        err = str(e)
        if "rate_limit" in err.lower() or "429" in err or "quota" in err.lower():
            msg = "OpenAI API rate limit reached. Wait a moment and refresh."
            tip = "Rate limits reset automatically after a short wait."
        elif "API key" in err or "api_key" in err or "Incorrect API key" in err:
            msg = "Set the OPENAI_API_KEY environment variable to enable smart alerts."
            tip = "Get an API key at platform.openai.com/api-keys"
        else:
            msg = f"AI service temporarily unavailable: {err[:120]}"
            tip = "Try refreshing the page in a moment."
        return [{"severity": "low", "title": "AI Alerts Unavailable", "message": msg, "suggestion": tip}]
