from fastapi import HTTPException, status, BackgroundTasks
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import httpx
from typing import Dict, Any

from app.models.user import UserCreate, UserRole
from app.models.auth import UserLogin, TokenResponse, GoogleAuthRequest
from app.schemas.user_schema import UserSchema
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token
)
from app.services.email_service import send_verification_email, send_password_reset_email
from app.config import settings

class AuthService:
    def __init__(self):
        self.token_serializer = URLSafeTimedSerializer(settings.SECRET_KEY)
    
    async def create_user(self, user_data: UserCreate, background_tasks: BackgroundTasks) -> Dict[str, str]:
        # Check for duplicate email or username
        if await UserSchema.find_by_email(user_data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if await UserSchema.find_by_username(user_data.username):
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Prepare user data for token (password already hashed)
        hashed_password = get_password_hash(user_data.password)
        token_data = {
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,
        }
        
        # Encode token
        verification_token = self.token_serializer.dumps(token_data, salt="email-verification")

        # Send verification email
        background_tasks.add_task(
            send_verification_email,
            user_data.email,
            user_data.username,
            verification_token
        )

        return {
            "message": "Verification email sent. Please check your inbox to complete registration."
        }

    
    async def authenticate_user(self, user_data: UserLogin) -> TokenResponse:
        user = await UserSchema.find_by_email(user_data.email.lower())
        if not user or not verify_password(user_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not user["is_email_verified"]:
            raise HTTPException(status_code=401, detail="Please verify your email before logging in")
        
        access_token = create_access_token(data={"sub": str(user["_id"])})
        refresh_token = create_refresh_token(data={"sub": str(user["_id"])})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    async def verify_email_token(self, token: str) -> Dict[str, str]:
        try:
            user_data = self.token_serializer.loads(token, salt="email-verification", max_age=3600)
        except SignatureExpired:
            raise HTTPException(status_code=400, detail="Verification token has expired")
        except BadSignature:
            raise HTTPException(status_code=400, detail="Invalid verification token")

        # Check again for duplicate email or username before creating
        if await UserSchema.find_by_email(user_data["email"]):
            return {"message": "Email already verified or in use"}
        
        if await UserSchema.find_by_username(user_data["username"]):
            raise HTTPException(status_code=400, detail="Username already taken")

        # Create user now
        user_dict = {
            "username": user_data["username"].lower(),
            "email": user_data["email"].lower(),
            "password": user_data["password"],
            "is_email_verified": True,
            "role": UserRole.USER,
            "preferences": {},
            "saved_recipes": [],
            "shopping_lists": [],
            "meal_plans": [],
            "auth_provider": "email"
        }

        await UserSchema.create(user_dict)

        return {"message": "Email verified and account created successfully"}

    async def google_authenticate(self, request: GoogleAuthRequest) -> TokenResponse:
        async with httpx.AsyncClient() as client:
            google_response = await client.get(
                f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={request.token}"
            )
            
            if google_response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid Google token")
            
            google_user = google_response.json()
            email = google_user.get("email")
            
            if not email:
                raise HTTPException(status_code=400, detail="Email not provided by Google")
            
            # Check if user exists
            user = await UserSchema.find_by_email(email.lower())
            
            if not user:
                # Create new user
                username = email.split("@")[0].lower()
                counter = 1
                original_username = username
                while await UserSchema.find_by_username(username):
                    username = f"{original_username}{counter}"
                    counter += 1
                
                user_dict = {
                    "username": username,
                    "email": email.lower(),
                    "password": None,
                    "is_email_verified": True,
                    "role": UserRole.USER,
                    "preferences": {},
                    "saved_recipes": [],
                    "shopping_lists": [],
                    "meal_plans": [],
                    "auth_provider": "google",
                    "google_id": google_user.get("id")
                }
                
                user = await UserSchema.create(user_dict)
            
            access_token = create_access_token(data={"sub": str(user["_id"])})
            refresh_token = create_refresh_token(data={"sub": str(user["_id"])})
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )