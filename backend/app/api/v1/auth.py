from fastapi import APIRouter, Depends, BackgroundTasks

from app.models.user import UserCreate, UserResponse
from app.models.auth import (
    UserLogin, TokenResponse, EmailVerificationRequest, 
    GoogleAuthRequest, RefreshTokenRequest
)
from app.services.auth_service import AuthService
from app.api.deps import get_current_active_user

router = APIRouter()

@router.post("/signup", response_model=dict)
async def signup(
    user_data: UserCreate, 
    background_tasks: BackgroundTasks,
    auth_service: AuthService = Depends()
):
    return await auth_service.create_user(user_data, background_tasks)

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, auth_service: AuthService = Depends()):
    return await auth_service.authenticate_user(user_data)

@router.post("/verify-email")
async def verify_email(token: str, auth_service: AuthService = Depends()):
    return await auth_service.verify_email_token(token)

@router.post("/google", response_model=TokenResponse)
async def google_login(request: GoogleAuthRequest, auth_service: AuthService = Depends()):
    return await auth_service.google_authenticate(request)

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_active_user)):
    return UserResponse(
        id=str(current_user["_id"]),
        username=current_user["username"],
        email=current_user["email"],
        is_email_verified=current_user["is_email_verified"],
        role=current_user["role"],
        preferences=current_user.get("preferences"),
        saved_recipes=current_user.get("saved_recipes", []),
        shopping_lists=current_user.get("shopping_lists", []),
        meal_plans=current_user.get("meal_plans", []),
        created_at=current_user["created_at"]
    )
