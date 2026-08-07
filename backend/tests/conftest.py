import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. Set environment variables BEFORE importing app or db modules
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from scripts.seed_data import seed_database

test_engine = create_engine("sqlite:///./test.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    
    db = TestingSessionLocal()
    seed_database(db)
    db.close()
    
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield
    app.dependency_overrides.clear()
    
    # Cleanup test db file after session completes
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass
