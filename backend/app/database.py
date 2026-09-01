import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Locate the SQLite database file in the backend root directory
BASE_DIR = Path(__file__).resolve().parent.parent
DB_FILE = BASE_DIR / "fraud_detection.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_FILE}"

# check_same_thread=False is required for SQLite when accessed across multiple threads in FastAPI
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that provides a database session per request
    and ensures the session is closed when the request is complete.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
