from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth import get_current_user
from app.database import get_database

security = HTTPBearer()

async def get_current_active_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    return await get_current_user(credentials)

async def get_db():
    return await get_database()