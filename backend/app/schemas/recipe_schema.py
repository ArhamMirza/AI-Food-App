from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import logging

from app.database import get_database

logger = logging.getLogger(__name__)

class RecipeSchema:
    @staticmethod
    async def create(user_id: str, title: str, content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new recipe in MongoDB.

        Args:
            user_id: ID of the user associated with the recipe
            title: Title of the recipe
            content: Recipe content (e.g., ingredients, instructions)

        Returns:
            Created recipe document

        Raises:
            ValueError: If title already exists for the user
        """
        db = await get_database()
        await db.recipes.create_index([("user_id", 1), ("title", 1)], unique=True)

        recipe_data = {
            "user_id": ObjectId(user_id),
            "title": title,
            "content": content,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        try:
            result = await db.recipes.insert_one(recipe_data)
            recipe_data["_id"] = result.inserted_id
            return recipe_data
        except DuplicateKeyError:
            raise ValueError(f"Recipe with title '{title}' already exists for this user")

    @staticmethod
    async def find_by_id(document_id: str) -> Optional[Dict[str, Any]]:
        """
        Find a recipe by its MongoDB document _id.

        Args:
            document_id: MongoDB document ID

        Returns:
            Recipe document or None if not found
        """
        db = await get_database()
        return await db.recipes.find_one({"_id": ObjectId(document_id)})

    @staticmethod
    async def find_by_user_id(user_id: str) -> List[Dict[str, Any]]:
        """
        Find all recipes for a given user.

        Args:
            user_id: ID of the user

        Returns:
            List of recipe documents
        """
        db = await get_database()
        cursor = db.recipes.find({"user_id": ObjectId(user_id)})
        return await cursor.to_list(length=None)

    @staticmethod
    async def find_by_user_id_and_title(user_id: str, title: str) -> Optional[Dict[str, Any]]:
        """
        Find a recipe by user_id and title.

        Args:
            user_id: ID of the user
            title: Title of the recipe

        Returns:
            Recipe document or None if not found
        """
        db = await get_database()
        return await db.recipes.find_one({"user_id": ObjectId(user_id), "title": title})

    @staticmethod
    async def update(document_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update a recipe's data.

        Args:
            document_id: MongoDB document ID of the recipe
            update_data: Data to update (e.g., title, content)

        Returns:
            True if updated, False if not found or no changes
        """
        db = await get_database()
        update_data["updated_at"] = datetime.utcnow()
        result = await db.recipes.update_one(
            {"_id": ObjectId(document_id)},
            {"$set": update_data}
        )
        return result.modified_count > 0

    @staticmethod
    async def delete(document_id: str) -> bool:
        """
        Delete a recipe by its MongoDB document _id.

        Args:
            document_id: MongoDB document ID

        Returns:
            True if deleted, False if not found
        """
        db = await get_database()
        result = await db.recipes.delete_one({"_id": ObjectId(document_id)})
        return result.deleted_count > 0