from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta

from ..database import get_db
from ..models import Transaction, Category, Merchant
from ..llm_service import generate_text

router = APIRouter(prefix="/api/insights", tags=["insights"])

INSIGHTS_PROMPT = """You are a personal finance analyst. Analyze the following transaction data and return EXACTLY 4 insight cards in JSON format.

Transaction data for the last 30 days:
{transactions}

Category totals:
{category_totals}

Previous month category totals (for comparison):
{prev_category_totals}

Return a JSON array of exactly 4 objects, each with:
- "title": short headline (5-8 words)
- "description": one sentence insight with specific numbers
- "type": one of "warning", "success", "info", "tip"
- "icon": one of "trending-up", "trending-down", "alert", "lightbulb"

Focus on: biggest spending category, month-over-month changes, unusual patterns, and one actionable saving tip.
Return ONLY valid JSON, no markdown formatting or code blocks."""


@router.get("")
def get_insights(db: Session = Depends(get_db)):
    today = date.today()
    cutoff_30 = today - timedelta(days=30)
    cutoff_60 = today - timedelta(days=60)

    recent = (
        db.query(Transaction)
        .join(Transaction.category_rel)
        .join(Transaction.merchant_rel)
        .filter(Transaction.type == "expense", Transaction.date >= cutoff_30)
        .all()
    )

    prev = (
        db.query(Transaction)
        .join(Transaction.category_rel)
        .join(Transaction.merchant_rel)
        .filter(
            Transaction.type == "expense",
            Transaction.date >= cutoff_60,
            Transaction.date < cutoff_30,
        )
        .all()
    )

    def summarize(txns):
        totals = {}
        for t in txns:
            cat_name = t.category_rel.name
            totals[cat_name] = totals.get(cat_name, 0) + t.amount
        return {k: round(v, 2) for k, v in sorted(totals.items(), key=lambda x: -x[1])}

    current_totals = summarize(recent)
    prev_totals = summarize(prev)

    tx_lines = "\n".join(
        f"- {t.date} | {t.merchant_rel.name} | ${t.amount:.2f} | {t.category_rel.name}"
        for t in sorted(recent, key=lambda x: x.date, reverse=True)[:50]
    )

    prompt = INSIGHTS_PROMPT.format(
        transactions=tx_lines,
        category_totals=current_totals,
        prev_category_totals=prev_totals,
    )

    try:
        raw = generate_text(prompt)
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[1]
            cleaned = cleaned.rsplit("```", 1)[0]
        import json
        insights = json.loads(cleaned)
        return insights
    except Exception as e:
        err = str(e)
        if "rate_limit" in err.lower() or "429" in err or "quota" in err.lower():
            msg = "OpenAI API rate limit reached. Wait a moment and refresh the page."
        elif "API key" in err or "api_key" in err or "Incorrect API key" in err:
            msg = "Set the OPENAI_API_KEY environment variable with a valid key from platform.openai.com/api-keys"
        else:
            msg = f"AI service temporarily unavailable: {err[:120]}"
        return [
            {"title": "AI Insights Unavailable", "description": msg, "type": "info", "icon": "alert"},
        ]
