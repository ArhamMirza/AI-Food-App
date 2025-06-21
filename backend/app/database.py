from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import logging
from app.config import settings

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

database = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        database.client = AsyncIOMotorClient(settings.MONGODB_URL)
        database.database = database.client[settings.DATABASE_NAME]
        
        # Test the connection
        await database.client.admin.command('ping')
        
        # Create unique indexes
        await database.database.users.create_index("email", unique=True)
        await database.database.users.create_index("username", unique=True)
        
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():  # Make this async
    """Close database connection"""
    if database.client:
        database.client.close()
        database.client = None
        database.database = None
        logger.info("Disconnected from MongoDB")

async def get_database():
    """Get database instance"""
    if database.database is None:
        raise RuntimeError("Database not connected")
    return database.database