from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional
from app.services.chat_service import ChatService

from app.models.chat import ChatMessage, ChatResponse, UpdateMessageRequest
from app.models.recipe import SavedRecipe

from app.schemas.recipe_schema import RecipeSchema
from app.schemas.chat_schema import ChatSchema

from app.config import settings
from app.core.utils import convert_objectid_in_doc
from uuid import uuid4
from pydantic import BaseModel

router = APIRouter()

chat_service = ChatService(
    groq_api_key=settings.GROQ_API_KEY,
    recipe_api_url=settings.RECIPE_API_URL
)

class CreateChatRequest(BaseModel):
    title: Optional[str] = None

class UpdateTitleRequest(BaseModel):
    title: str

@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_message: ChatMessage,
    user_id: str = Query(...),
    conversation_id: Optional[str] = Query(None),
    search: bool = Query(False),
    search_type: str = Query(...)
):
    """Main chat endpoint"""
    try:
        response, conv_id = await chat_service.process_message(
            message=chat_message.message,
            user_id=user_id,
            conversation_id=conversation_id,
            search=search,
            search_type=search_type
        )
        return ChatResponse(response=response, conversation_id=conv_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@router.post("/chat/create")
async def create_chat(
    user_id: str = Query(...),
    request: CreateChatRequest = Body(default_factory=CreateChatRequest)
):
    """
    Create a new chat conversation with a generated conversation_id, optional title, and a system message.
    """
    try:
        # Generate unique conversation_id
        conversation_id = str(uuid4())
        system_message = chat_service.get_system_message()
        
        # Use provided title or generate a default one
        chat_title = request.title if request.title and request.title.strip() else f"New Chat"

        # Create conversation in DB
        await ChatSchema.create(
            conversation_id=conversation_id,
            user_id=user_id,
            initial_message=system_message,
            title=chat_title
        )

        return {
            "conversation_id": conversation_id,
            "title": chat_title,
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
    """Retrieve all conversations for a user with titles"""
    try:
        conversations = await ChatSchema.find_by_user_id(user_id)
        converted_conversations = convert_objectid_in_doc(conversations)
        
        # Ensure each conversation has a title field
        for conv in converted_conversations:
            if 'title' not in conv or not conv['title']:
                conv['title'] = f"Chat {conv.get('conversation_id', '')[-6:]}"
        
        return converted_conversations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve conversations: {str(e)}")

@router.put("/chat/{conversation_id}/title")
async def update_conversation_title(
    conversation_id: str,
    request: UpdateTitleRequest
):
    """Update the title of a conversation"""
    try:
        if not request.title or not request.title.strip():
            raise HTTPException(status_code=400, detail="Title cannot be empty")
        
        updated = await ChatSchema.update_title(conversation_id, request.title.strip())
        if not updated:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        return {
            "success": True,
            "message": "Title updated successfully",
            "title": request.title.strip()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update title: {str(e)}")

@router.delete("/chat/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation by ID"""
    deleted = await ChatSchema.delete(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found or already deleted")
    return {"success": True, "message": "Conversation deleted"}

@router.get("/chat/user/{user_id}/ids")
async def list_user_conversation_ids(user_id: str):
    """List conversation IDs and titles for a given user"""
    try:
        conversations = await ChatSchema.find_by_user_id(user_id)
        converted_conversations = convert_objectid_in_doc(conversations)
        
        conversation_data = []
        for conv in converted_conversations:
            if "conversation_id" in conv:
                conversation_data.append({
                    "conversation_id": conv["conversation_id"],
                    "title": conv.get("title", f"Chat {conv['conversation_id'][-6:]}")
                })
        
        return {"conversations": conversation_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list conversations: {str(e)}")

@router.get("/chat/user/{user_id}/summary")
async def get_user_conversations_summary(user_id: str):
    """Get a summary of all conversations for a user (ID, title, last message timestamp)"""
    try:
        conversations = await ChatSchema.find_by_user_id(user_id)
        converted_conversations = convert_objectid_in_doc(conversations)
        
        summary = []
        for conv in converted_conversations:
            if "conversation_id" in conv:
                # Get last message timestamp if available
                last_message_time = None
                if "messages" in conv and conv["messages"]:
                    # Assuming messages have a timestamp field
                    last_message_time = conv["messages"][-1].get("timestamp")
                
                summary.append({
                    "conversation_id": conv["conversation_id"],
                    "title": conv.get("title", f"Chat {conv['conversation_id'][-6:]}"),
                    "message_count": len(conv.get("messages", [])),
                    "last_message_time": last_message_time,
                    "created_at": conv.get("created_at")
                })
        
        # Sort by last message time or created_at (most recent first)
        summary.sort(key=lambda x: x.get("last_message_time") or x.get("created_at", ""), reverse=True)
        
        return {"conversations": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get conversations summary: {str(e)}")
    
@router.put("/chat/{conversation_id}/message/{message_index}")
async def update_conversation_message(
    conversation_id: str,
    message_index: int,
    request: UpdateMessageRequest
):
    """Update a specific message in a conversation"""
    try:
        if not request.content or not request.content.strip():
            raise HTTPException(status_code=400, detail="Content cannot be empty")
        
        updated = await ChatSchema.update_message(
            conversation_id=conversation_id,
            message_index=message_index,
            content=request.content.strip(),
            role=request.role or "assistant"
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Conversation or message not found")
        
        return {
            "success": True,
            "message": "Message updated successfully",
            "content": request.content.strip(),
            "role": request.role or "assistant"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update message: {str(e)}")
    
@router.post("/chat/save-recipe")
async def save_recipe(request: SavedRecipe):
    """Save a recipe for a user"""
    try:
        if not request.content or not request.content.strip():
            raise HTTPException(status_code=400, detail="Recipe content cannot be empty")
        if not request.title or not request.title.strip():
            raise HTTPException(status_code=400, detail="Recipe title cannot be empty")
        
        # Generate a unique recipe ID
        recipe_id = str(uuid4())
        
        # Prepare recipe content
        content = {
            "text": request.content.strip()
        }

        # Save to MongoDB using RecipeSchema
        recipe_doc = await RecipeSchema.create(
            user_id=request.user_id,
            title=request.title.strip(),
            content=content
        )

        recipe_doc = convert_objectid_in_doc(recipe_doc)


        return {
            "success": True,
            "message": "Recipe saved successfully",
            "recipe_id": str(recipe_doc["_id"]),
            "title": request.title.strip()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save recipe: {str(e)}")