"""
Database Connection setup using SQLAlchemy & SQLite
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./netguard.db"

# connect_args={"check_same_thread": False} is required for SQLite multi-threading in FastAPI
engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    FastAPI dependency that yields a database session per request and closes it after.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
