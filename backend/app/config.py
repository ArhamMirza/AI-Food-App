from pydantic_settings import BaseSettings
from dotenv import load_dotenv

from typing import Optional

load_dotenv()  # loads .env into environment variables

class Settings(BaseSettings):
    # Database
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "food_assistant_db"
    
    # JWT
    SECRET_KEY: str = ""
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Email
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = ""
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:5173"

    #AI Chat
    GROQ_API_KEY: str= ""
    RECIPE_API_URL: str = "http://localhost:8000/api/v1/recipe/search"

    # Google search api
    GOOGLE_CSE_ID: str = ""
    GOOGLE_API_KEY: str = ""
    
    
    class Config:
        env_file = "app/.env"

settings = Settings()
print(settings.MONGODB_URL)
