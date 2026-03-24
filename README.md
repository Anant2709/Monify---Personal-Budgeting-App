# Monify — AI-Powered Personal Finance Tracker

A full-stack budgeting app that combines interactive spending visualizations with AI-powered insights, a personalized financial advisor chat, smart budget alerts, and receipt scanning. Built with React and FastAPI.

![Dashboard](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white)
![Backend](https://img.shields.io/badge/FastAPI-Backend-009688?logo=fastapi&logoColor=white)
![AI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?logo=openai&logoColor=white)
![DB](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)

---

## Features

### Spending Dashboard
- Account balance, monthly spending vs income, and savings rate at a glance
- Interactive pie chart with per-month filtering for category breakdowns
- Monthly income vs expenses trend (area chart)
- Fully filterable transaction table — search, category dropdown, date range picker, and clickable category badges
- Manual transaction entry with expense/income toggle

### AI Spending Insights
- 4 AI-generated insight cards analyzing your last 30 days vs the previous 30
- Detects spending spikes, savings opportunities, and unusual patterns
- Structured JSON prompting for predictable, well-formatted UI cards

### AI Financial Advisor Chat
- Conversational interface for budgeting, investing, 401(k), Roth IRA, and more
- Personalized responses — your actual spending data is injected into every prompt
- Real-time streaming via Server-Sent Events (SSE)
- Markdown rendering with headers, lists, bold text, and emojis
- Persistent chat history with sidebar — conversations survive navigation and page refreshes

### Smart Budget Alerts
- Hybrid detection: deterministic Python rules catch anomalies, AI generates natural language alerts
- Category spending spikes (>30% month-over-month)
- Unusually large transactions (>2x category average)
- New merchant detection
- Severity-sorted display (high / medium / low)

### Receipt Scanner
- Drag-and-drop receipt upload with AI-powered data extraction (GPT-4o-mini vision)
- Extracts merchant, date, total, individual line items, and suggested category
- Each line item saved as a separate transaction for granular analytics
- Two-phase flow: scan → review → confirm

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TailwindCSS v4, Recharts, ReactMarkdown, DM Sans |
| Backend | Python, FastAPI, SQLAlchemy ORM, Pydantic |
| Database | SQLite (normalized: transactions, categories, merchants with FKs) |
| AI | OpenAI GPT-4o-mini (text + vision) |
| Streaming | Server-Sent Events (SSE) with JSON-encoded chunks |
| Auth/Secrets | python-dotenv, .env file (gitignored) |

---

## Architecture

```
┌─────────────────────────────┐       ┌──────────────────────────────┐
│  React Frontend (Vite)      │       │  FastAPI Backend (Python)    │
│                             │       │                              │
│  - TailwindCSS + DM Sans    │  API  │  - SQLAlchemy ORM            │
│  - Recharts (charts)        │◄─────►│  - SQLite (budget.db)        │
│  - ReactMarkdown (chat)     │ REST  │  - OpenAI GPT-4o-mini        │
│  - localStorage (chat hist) │ + SSE │  - python-dotenv (.env)      │
└─────────────────────────────┘       └──────────────────────────────┘
```

**Database schema** — normalized with three tables:

```
categories (id, name)
    │
    ├──< transactions (id, date, merchant_id, amount, category_id, description, type)
    │
merchants (id, name)
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- An OpenAI API key ([platform.openai.com/api-keys](https://platform.openai.com/api-keys))

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` folder:

```
OPENAI_API_KEY=sk-your-key-here
```

Start the server:

```bash
uvicorn app.main:app --reload --port 8000
```

The database seeds automatically on first run with 3 months of realistic mock data.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── database.py          # SQLAlchemy engine + session config
│   │   ├── models.py            # Transaction, Category, Merchant models
│   │   ├── seed_data.py         # Idempotent mock data seeding
│   │   ├── llm_service.py       # OpenAI wrapper (text, streaming, vision)
│   │   └── routes/
│   │       ├── transactions.py  # CRUD + analytics endpoints
│   │       ├── insights.py      # AI spending insights
│   │       ├── chat.py          # Streaming AI advisor
│   │       ├── alerts.py        # Hybrid anomaly detection + AI alerts
│   │       └── scanner.py       # Receipt scanning + per-item saving
│   ├── requirements.txt
│   └── .env                     # API key (gitignored)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Routes + layout
│   │   ├── index.css            # Theme (warm coral/cream palette)
│   │   ├── services/api.js      # API client (Axios + Fetch for SSE)
│   │   └── components/
│   │       ├── Dashboard/       # Summary, charts, table, filters, add modal
│   │       ├── Chat/            # AI advisor with history sidebar
│   │       ├── Alerts/          # Smart budget alerts
│   │       ├── Scanner/         # Receipt upload + confirm
│   │       └── Layout/          # Sidebar navigation
│   └── index.html
│
└── .gitignore
```

---

## Key Design Decisions

- **Normalized database** over a flat table — enables vendor analytics and prevents data quality issues from string duplication
- **SSE over WebSocket** for chat streaming — simpler, unidirectional, natively supported by FastAPI
- **Hybrid alerts** (rules + AI) — deterministic anomaly detection for accuracy, AI for natural language
- **Structured JSON prompting** — LLM returns JSON for insights/alerts so the UI stays predictable
- **Per-item receipt saving** — each line item becomes its own transaction for granular spending analysis
- **Client-side filtering** — instant UX for ~300 rows, avoids API round-trips
- **LLM abstraction layer** — `llm_service.py` wraps all AI calls behind clean functions, making provider swaps trivial

---

## Roadmap

- [ ] **Plaid integration** — real bank account linking via OAuth, webhook-based transaction syncing
- [ ] **User authentication** — JWT-based auth, multi-tenant data isolation, database-backed chat history
- [ ] **PostgreSQL migration** — swap SQLite for Postgres, add Alembic for schema migrations
- [ ] **Budget goals** — per-category spending limits with progress tracking and AI recommendations
- [ ] **Recurring transaction detection** — identify subscriptions, flag price increases, suggest cancellations
- [ ] **Export & reporting** — CSV/PDF export, monthly summaries, tax-categorized reports
- [ ] **Mobile responsive** — fully responsive layout for phone and tablet use

---

## License

MIT
