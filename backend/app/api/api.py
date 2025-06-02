from fastapi import APIRouter

from app.api.v1 import auth
from app.api.v1 import recipe
from app.api.v1 import chatbot

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(recipe.router, prefix="/recipe", tags=["Recipe"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["Chatbot"])

