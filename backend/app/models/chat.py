from pydantic import BaseModel, Field
from typing import Optional, List, Union

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    conversation_id: Optional[str]