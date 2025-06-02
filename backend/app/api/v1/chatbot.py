from fastapi import APIRouter,HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
import uvicorn
from typing import Optional
from app.services.chat_service import ChatService, RecipeSearchRequest, RecipeSearchResponse
from app.models.chat import ChatMessage,ChatResponse

router = APIRouter()

# Initialize ChatService
GROQ_API_KEY = "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"
RECIPE_API_URL = "http://localhost:8000/api/v1/recipe/search"

chat_service = ChatService(
    groq_api_key=GROQ_API_KEY,
    recipe_api_url=RECIPE_API_URL
)

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage, conversation_id: Optional[str] = None):
    """Main chat endpoint"""
    try:
        response, conv_id = await chat_service.process_message(
            message=chat_message.message,
            conversation_id=conversation_id
        )
        return ChatResponse(response=response, conversation_id=conv_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation history"""
    conversation = chat_service.get_conversation(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"conversation_id": conversation_id, "messages": conversation}

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    if not chat_service.delete_conversation(conversation_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return {"message": "Conversation deleted successfully"}

@router.get("/conversations")
async def list_conversations():
    """List all conversations"""
    return {"conversations": chat_service.list_conversations()}
