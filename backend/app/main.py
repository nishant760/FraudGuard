from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import health, prediction, transactions, analytics

# Create database tables automatically upon startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Financial Transaction Fraud Detection & Risk Intelligence API",
    description="Backend REST API providing real-time transaction fraud scoring, persistent audit logging, and risk analytics.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration for Frontend Development
# Allows the React frontend (running on default Vite port 5173 or React port 3000) to communicate with FastAPI.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(health.router)
app.include_router(prediction.router)
app.include_router(transactions.router)
app.include_router(analytics.router)


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to the Financial Transaction Fraud Detection API",
        "docs": "/docs",
        "health": "/health"
    }
