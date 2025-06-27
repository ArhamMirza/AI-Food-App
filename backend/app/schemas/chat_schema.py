from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import logging

from app.database import get_database

logger = logging.getLogger(__name__)

class ChatSchema:
    @staticmethod
    async def create(conversation_id: str, user_id: str, title:str, initial_message: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a new chat conversation in MongoDB.

        Args:
            conversation_id: Unique identifier for the conversation
            user_id: ID of the user associated with the conversation
            initial_message: Optional initial message (e.g., system message)

        Returns:
            Created conversation document

        Raises:
            ValueError: If conversation_id already exists
        """
        db = await get_database()
        await db.conversations.create_index("conversation_id", unique=True)

        messages = [initial_message] if initial_message else []
        conversation_data = {
            "conversation_id": conversation_id,
            "user_id": ObjectId(user_id),
            "title": title,
            "messages": messages,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        try:
            result = await db.conversations.insert_one(conversation_data)
            conversation_data["_id"] = result.inserted_id
            return conversation_data
        except DuplicateKeyError:
            raise ValueError("Conversation ID already exists")

    @staticmethod
    async def find_by_conversation_id(conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Find a conversation by its conversation_id.

        Args:
            conversation_id: Unique identifier for the conversation

        Returns:
            Conversation document or None if not found
        """
        db = await get_database()
        return await db.conversations.find_one({"conversation_id": conversation_id})

    @staticmethod
    async def find_by_user_id(user_id: str) -> List[Dict[str, Any]]:
        """
        Find all conversations for a given user.

        Args:
            user_id: ID of the user

        Returns:
            List of conversation documents
        """
        db = await get_database()
        cursor = db.conversations.find({"user_id": ObjectId(user_id)})
        return await cursor.to_list(length=None)

    @staticmethod
    async def find_by_id(document_id: str) -> Optional[Dict[str, Any]]:
        """
        Find a conversation by its MongoDB document _id.

        Args:
            document_id: MongoDB document ID

        Returns:
            Conversation document or None if not found
        """
        db = await get_database()
        return await db.conversations.find_one({"_id": ObjectId(document_id)})

    @staticmethod
    async def update(conversation_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update a conversation (e.g., append new messages).

        Args:
            conversation_id: Unique identifier for the conversation
            update_data: Data to update (e.g., messages array)

        Returns:
            True if updated, False if not found or no changes
        """
        db = await get_database()
        update_data["updated_at"] = datetime.utcnow()
        result = await db.conversations.update_one(
            {"conversation_id": conversation_id},
            {"$set": update_data}
        )
        return result.modified_count > 0


    @staticmethod
    async def append_message(conversation_id: str, message: Dict[str, Any]) -> bool:
        """
        Append a message to a conversation's messages array.

        Args:
            conversation_id: Unique identifier for the conversation
            message: Message to append (can be user/assistant/tool call)

        Returns:
            True if updated, False if not found
        """
        if not isinstance(message, dict) or "role" not in message:
            raise ValueError("Invalid message format")

        role = message["role"]
        logger.info(message)

        if role == "assistant" and "tool_calls" in message:
            # Validate tool_calls structure
            if not isinstance(message["tool_calls"], list):
                raise ValueError("Invalid tool_calls format")
            for tool_call in message["tool_calls"]:
                if not all(k in tool_call for k in ("id", "type", "function")):
                    raise ValueError("Malformed tool_call entry")
                if not all(k in tool_call["function"] for k in ("name", "arguments")):
                    raise ValueError("Malformed function in tool_call")

        elif role in {"user", "assistant", "system"}:
            if "content" not in message:
                raise ValueError("Message missing content")

        else:
            raise ValueError(f"Unsupported role or structure: {message}")

        # Add timestamp
        message["timestamp"] = datetime.utcnow()

        db = await get_database()
        result = await db.conversations.update_one(
            {"conversation_id": conversation_id},
            {
                "$push": {"messages": message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

        return result.modified_count > 0

    
    @staticmethod
    async def update_message(conversation_id: str, message_index: int, content: str, role: str) -> bool:
        """
        Update a specific message in a conversation by index.

        Args:
            conversation_id: Unique identifier for the conversation
            message_index: Index of the message to update in the messages array
            content: New content of the message
            role: New role of the message (e.g., 'user', 'assistant')

        Returns:
            True if updated successfully, False if conversation or message not found
        """
        db = await get_database()

        # Fetch the conversation
        conversation = await db.conversations.find_one({"conversation_id": conversation_id})
        if not conversation or message_index >= len(conversation.get("messages", [])):
            return False

        # Build the dynamic field update path
        content_path = f"messages.{message_index}.content"
        role_path = f"messages.{message_index}.role"
        timestamp_path = f"messages.{message_index}.timestamp"

        result = await db.conversations.update_one(
            {"conversation_id": conversation_id},
            {
                "$set": {
                    content_path: content,
                    role_path: role,
                    timestamp_path: datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )
        return result.modified_count > 0


    @staticmethod
    async def delete(conversation_id: str) -> bool:
        """
        Delete a conversation by its conversation_id.

        Args:
            conversation_id: Unique identifier for the conversation

        Returns:
            True if deleted, False if not found
        """
        db = await get_database()
        result = await db.conversations.delete_one({"conversation_id": conversation_id})
        return result.deleted_count > 0
