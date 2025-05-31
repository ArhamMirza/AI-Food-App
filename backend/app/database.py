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
    database.client = AsyncIOMotorClient(settings.MONGODB_URL)
    database.database = database.client[settings.DATABASE_NAME]
    
    # Create unique indexes
    await database.database.users.create_index("email", unique=True)
    await database.database.users.create_index("username", unique=True)
    
    logger.info("Connected to MongoDB")

async def close_mongo_connection():
    """Close database connection"""
    if database.client:
        database.client.close()
        logger.info("Disconnected from MongoDB")

async def get_database():
    """Get database instance"""
    return database.database