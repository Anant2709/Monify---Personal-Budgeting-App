from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .seed_data import seed_database
from .routes import transactions, insights, chat, alerts, scanner

Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="Monify API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router)
app.include_router(insights.router)
app.include_router(chat.router)
app.include_router(alerts.router)
app.include_router(scanner.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
