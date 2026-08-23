import logging
from contextlib import asynccontextmanager
from typing import Any
from fastapi import FastAPI
from app.core.config import settings
from app.core.json_db import JSONDatabase

logger = logging.getLogger(__name__)

class DatabaseManager:
    client: Any = None
    db: JSONDatabase = None

db_manager = DatabaseManager()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing zero-configuration local JSON database...")
    # Initialize the local JSON file-based database (stores in data/ folder)
    db_manager.db = JSONDatabase()
    db_manager.client = db_manager.db  # For compatibility

    try:
        await db_manager.db.admin.command('ping')
        logger.info(f"Local JSON Database is ready. Data stored in '{db_manager.db.data_dir}'")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

    # Initialize collections and indexes (safe no-ops in JSON DB)
    await db_manager.db.students.create_index("email", unique=True)
    await db_manager.db.exercise_results.create_index([("student_id", 1), ("exercise_id", 1)])
    await db_manager.db.student_memory.create_index("student_id", unique=True)
    
    yield
    
    logger.info("Closing JSON database connection")
    if db_manager.db is not None:
        db_manager.db.close()

def get_database() -> JSONDatabase:
    """Dependency provider returning the active database instance."""
    if db_manager.db is None:
        db_manager.db = JSONDatabase()
    return db_manager.db
