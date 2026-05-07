from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://mec_user:mec2025secure@localhost/digital_mec"
)

engine = create_engine(
    DATABASE_URL,
    pool_size=10,           # Keep 10 connections open
    max_overflow=20,        # Allow 20 extra connections under load
    pool_pre_ping=True,     # Verify connections before use
    pool_recycle=300,       # Recycle connections every 5 minutes
    connect_args={
        "connect_timeout": 5,
        "options": "-c statement_timeout=30000"
    } if "postgresql" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()