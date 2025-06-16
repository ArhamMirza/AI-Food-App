from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import logging

from app.database import get_database

logger = logging.getLogger(__name__)

class MealPlanSchema:
    @staticmethod
    async def create(data: Dict[str, Any]) -> Dict[str, Any]:
        db = await get_database()

        meal_plan = {
            "user_id": ObjectId(data["user_id"]),
            "date": data["date"],
            "meal_type": data["meal_type"],
            "recipe_id": ObjectId(data["recipe_id"]) if data.get("recipe_id") else None,
            "recipe_title": data.get("recipe_title"),
            "custom_meal": data.get("custom_meal"),
            "notes": data.get("notes"),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await db.meal_plans.insert_one(meal_plan)
        meal_plan["_id"] = result.inserted_id
        return meal_plan

    @staticmethod
    async def find_by_id(meal_plan_id: str) -> Optional[Dict[str, Any]]:
        db = await get_database()
        return await db.meal_plans.find_one({"_id": ObjectId(meal_plan_id)})

    @staticmethod
    async def find_by_user_id(user_id: str) -> List[Dict[str, Any]]:
        db = await get_database()
        cursor = db.meal_plans.find({"user_id": ObjectId(user_id)})
        return await cursor.to_list(length=None)

    @staticmethod
    async def update(meal_plan_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        db = await get_database()

        if "user_id" in update_data:
            update_data["user_id"] = ObjectId(update_data["user_id"])
        if "recipe_id" in update_data and update_data["recipe_id"]:
            update_data["recipe_id"] = ObjectId(update_data["recipe_id"])

        update_data["updated_at"] = datetime.utcnow()

        result = await db.meal_plans.update_one(
            {"_id": ObjectId(meal_plan_id)},
            {"$set": update_data}
        )

        if result.modified_count:
            return await db.meal_plans.find_one({"_id": ObjectId(meal_plan_id)})
        return None

    @staticmethod
    async def delete(meal_plan_id: str) -> bool:
        db = await get_database()
        result = await db.meal_plans.delete_one({"_id": ObjectId(meal_plan_id)})
        return result.deleted_count > 0

    @staticmethod
    async def find_by_date_range(user_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        db = await get_database()
        cursor = db.meal_plans.find({
            "user_id": ObjectId(user_id),
            "date": {"$gte": start_date, "$lte": end_date}
        })
        return await cursor.to_list(length=None)
