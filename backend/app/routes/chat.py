import json as _json
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import date, timedelta

from ..database import get_db
from ..models import Transaction, Category, Merchant
from ..llm_service import generate_text_stream

router = APIRouter(prefix="/api/chat", tags=["chat"])

SYSTEM_PROMPT = """You are a friendly, knowledgeable personal financial advisor specializing in US personal finance. You have deep knowledge of:

- 401(k) plans (traditional and Roth), contribution limits, employer matching
- Individual Retirement Accounts (Traditional IRA, Roth IRA, backdoor Roth)
- Health Savings Accounts (HSA) and their triple tax advantage
- Index fund investing (S&P 500, total market, three-fund portfolio)
- Emergency fund strategies (3-6 months of expenses)
- Debt payoff strategies (avalanche vs snowball methods)
- Tax-advantaged accounts and tax-loss harvesting
- Budgeting frameworks (50/30/20 rule, zero-based budgeting)

The user's recent financial data is provided below. Reference it when giving personalized advice.
Keep responses conversational, practical, and under 300 words unless the user asks for detail.
Always include specific numbers from their data when relevant.
Never give specific stock picks or guarantee returns.

FORMATTING RULES (very important — follow strictly):
- Use markdown formatting: **bold** for emphasis, bullet points, and numbered lists.
- Always put each numbered step or bullet point on its OWN line with a blank line between items.
- Use relevant emojis at the start of key points (e.g. 💰, 📊, 🎯, ✅, ⚠️, 💡, 🏦, 📈).
- Break your response into short paragraphs. Never write a wall of text.
- Use headers (### ) to organize longer answers into sections.
- End with a brief encouraging or actionable takeaway.

USER'S FINANCIAL CONTEXT:
{financial_context}"""


def build_financial_context(db: Session) -> str:
    today = date.today()
    cutoff = today - timedelta(days=30)

    recent_expenses = (
        db.query(Transaction)
        .join(Transaction.category_rel)
        .join(Transaction.merchant_rel)
        .filter(Transaction.type == "expense", Transaction.date >= cutoff)
        .all()
    )

    recent_income = (
        db.query(Transaction)
        .join(Transaction.category_rel)
        .join(Transaction.merchant_rel)
        .filter(Transaction.type == "income", Transaction.date >= cutoff)
        .all()
    )

    total_expenses = sum(t.amount for t in recent_expenses)
    total_income = sum(t.amount for t in recent_income)

    category_totals = {}
    for t in recent_expenses:
        cat_name = t.category_rel.name
        category_totals[cat_name] = category_totals.get(cat_name, 0) + t.amount

    merchant_totals = {}
    merchant_visits = {}
    for t in recent_expenses:
        m_name = t.merchant_rel.name
        merchant_totals[m_name] = merchant_totals.get(m_name, 0) + t.amount
        merchant_visits[m_name] = merchant_visits.get(m_name, 0) + 1

    sorted_cats = sorted(category_totals.items(), key=lambda x: -x[1])
    sorted_merchants = sorted(merchant_totals.items(), key=lambda x: -x[1])[:5]

    cat_breakdown = "\n".join(f"  - {cat}: ${amt:.2f}" for cat, amt in sorted_cats)
    merchant_breakdown = "\n".join(
        f"  - {m}: ${merchant_totals[m]:.2f} ({merchant_visits[m]} visits)"
        for m, _ in sorted_merchants
    )

    return f"""Monthly Income: ${total_income:.2f}
Monthly Expenses: ${total_expenses:.2f}
Monthly Savings: ${total_income - total_expenses:.2f}
Savings Rate: {((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0:.1f}%

Spending by Category (last 30 days):
{cat_breakdown}

Top 5 Merchants by Spend:
{merchant_breakdown}

Top 5 Most Visited Merchants:
""" + "\n".join(
        f"  - {m}: {merchant_visits[m]} visits (${merchant_totals[m]:.2f} total)"
        for m, _ in sorted(merchant_visits.items(), key=lambda x: -x[1])[:5]
    )


@router.post("/stream")
async def chat_stream(request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    user_message = body.get("message", "")
    history = body.get("history", [])

    context = build_financial_context(db)
    system = SYSTEM_PROMPT.format(financial_context=context)

    conversation = ""
    for msg in history[-10:]:
        role = "User" if msg["role"] == "user" else "Advisor"
        conversation += f"{role}: {msg['content']}\n"
    conversation += f"User: {user_message}\nAdvisor:"

    def event_stream():
        try:
            for chunk in generate_text_stream(conversation, system_instruction=system):
                yield f"data: {_json.dumps(chunk)}\n\n"
        except Exception as e:
            err = str(e)
            if "rate_limit" in err.lower() or "429" in err:
                yield f"data: {_json.dumps('Sorry, the AI service is temporarily rate-limited. Please wait a moment and try again.')}\n\n"
            else:
                yield f"data: {_json.dumps('Sorry, something went wrong: ' + err[:150])}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
