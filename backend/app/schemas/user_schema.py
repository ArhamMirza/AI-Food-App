from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import logging

from app.database import get_database
from app.models.user import UserRole

logger = logging.getLogger(__name__)

class UserSchema:
    @staticmethod
    async def create(user_data: dict) -> dict:
        db = await get_database()
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        
        try:
            result = await db.users.insert_one(user_data)
            user_data["_id"] = result.inserted_id
            return user_data
        except DuplicateKeyError as e:
            if "email" in str(e):
                raise ValueError("Email already exists")
            elif "username" in str(e):
                raise ValueError("Username already exists")
            raise ValueError("Duplicate key error")
    
    @staticmethod
    async def find_by_email(email: str) -> Optional[dict]:
        db = await get_database()
        return await db.users.find_one({"email": email})
    
    @staticmethod
    async def find_by_username(username: str) -> Optional[dict]:
        db = await get_database()
        return await db.users.find_one({"username": username})
    
    @staticmethod
    async def find_by_id(user_id: str) -> Optional[dict]:
        db = await get_database()
        return await db.users.find_one({"_id": ObjectId(user_id)})
    
    @staticmethod
    async def update(user_id: str, update_data: dict) -> bool:
        db = await get_database()
        update_data["updated_at"] = datetime.utcnow()
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0
    
    @staticmethod
    async def verify_email(user_id: str) -> bool:
        return await UserSchema.update(user_id, {
            "is_email_verified": True,
            "email_verified_at": datetime.utcnow()
        })