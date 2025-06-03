from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.chat_service import ChatService
from app.models.chat import ChatMessage, ChatResponse
from app.config import settings
from app.schemas.chat_schema import ChatSchema
from app.core.utils import convert_objectid_in_doc
from uuid import uuid4


router = APIRouter()

chat_service = ChatService(
    groq_api_key=settings.GROQ_API_KEY,
    recipe_api_url=settings.RECIPE_API_URL
)

@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_message: ChatMessage,
    user_id: str = Query(...),
    conversation_id: Optional[str] = Query(None),
    search: bool = Query(False)
):
    """Main chat endpoint"""
    try:
        response, conv_id = await chat_service.process_message(
            message=chat_message.message,
            user_id=user_id,
            conversation_id=conversation_id,
            search=search
        )
        return ChatResponse(response=response, conversation_id=conv_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/chat/create")
async def create_chat(user_id: str):
    """
    Create a new chat conversation with a generated conversation_id and a system message.
    """
    try:
        # Generate unique conversation_id
        conversation_id = str(uuid4())
        system_message = chat_service.get_system_message()

        # Create conversation in DB
        await ChatSchema.create(
            conversation_id=conversation_id,
            user_id=user_id,
            initial_message=system_message
        )

        return {
            "conversation_id": conversation_id,
            "status": "created"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")

@router.get("/chat/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Retrieve a single conversation by ID"""
    conversation = await ChatSchema.find_by_conversation_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return convert_objectid_in_doc(conversation)

@router.get("/chat/user/{user_id}")
async def get_conversations_by_user(user_id: str):
    """Retrieve all conversations for a user"""
    try:
        conversations = await ChatSchema.find_by_user_id(user_id)
        return convert_objectid_in_doc(conversations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversations: {str(e)}")

@router.delete("/chat/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation by ID"""
    deleted = await ChatSchema.delete(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found or already deleted")
    return {"success": True, "message": "Conversation deleted"}

@router.get("/chat/user/{user_id}/ids")
async def list_user_conversation_ids(user_id: str):
    """List only conversation IDs for a given user"""
    try:
        conversations = await ChatSchema.find_by_user_id(user_id)
        ids = [conv["conversation_id"] for conv in convert_objectid_in_doc(conversations) if "conversation_id" in conv]
        return {"conversation_ids": ids}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list conversation IDs: {str(e)}")
