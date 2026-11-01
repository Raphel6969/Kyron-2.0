import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    DATABASE_URL = DATABASE_URL.strip('"').strip("'")
    # Ensure driver compatibility for SQLAlchemy 2.0+ with psycopg2
    if DATABASE_URL.startswith("postgresql://") and "+psycopg" not in DATABASE_URL:
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
else:
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    # Ensure all models are imported so their tables are registered on Base.metadata
    import control.app.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

def get_database_info() -> dict:
    neon_branch = os.getenv("NEON_BRANCH", "production")
    is_neon = bool(DATABASE_URL and ("neon.tech" in DATABASE_URL or "ep-" in DATABASE_URL))
    return {
        "provider": "Neon Serverless Postgres" if is_neon else "Postgres (Local)",
        "branch": neon_branch if is_neon else "local",
        "is_neon": is_neon,
        "engine_dialect": engine.dialect.name,
    }
