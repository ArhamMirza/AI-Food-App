from fastapi import HTTPException, status, BackgroundTasks, Response
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
import httpx
from typing import Dict, Any

from app.models.user import UserCreate, UserRole
from app.models.auth import UserLogin, TokenResponse, GoogleAuthRequest, RefreshTokenRequest
from app.schemas.user_schema import UserSchema
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token
)
from app.firebase import firebase_auth,firebase_admin
from app.services.email_service import send_verification_email, send_password_reset_email
from app.config import settings
from firebase_admin.exceptions import FirebaseError
from bson import ObjectId


class AuthService:
    def __init__(self):
        self.token_serializer = URLSafeTimedSerializer(settings.SECRET_KEY)
    
    async def create_user(self, user_data: UserCreate, background_tasks: BackgroundTasks) -> Dict[str, str]:
        if await UserSchema.find_by_email(user_data.email):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        if await UserSchema.find_by_username(user_data.username):
            raise HTTPException(status_code=400, detail="Username already taken")
        
        hashed_password = get_password_hash(user_data.password)
        token_data = {
            "username": user_data.username,
            "email": user_data.email,
            "password": hashed_password,
        }
        
        verification_token = self.token_serializer.dumps(token_data, salt="email-verification")

        background_tasks.add_task(
            send_verification_email,
            user_data.email,
            user_data.username,
            verification_token
        )

        return {
            "message": "Verification email sent. Please check your inbox to complete registration."
        }

    
    async def authenticate_user(self, user_data: UserLogin, response: Response) -> TokenResponse:
        user = await UserSchema.find_by_email(user_data.email.lower())
        if not user or not verify_password(user_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if not user["is_email_verified"]:
            raise HTTPException(status_code=401, detail="Please verify your email before logging in")
        
        access_token = create_access_token(data={"sub": str(user["_id"]), "type":"access"})
        refresh_token = create_refresh_token(data={"sub": str(user["_id"]), "type":"refresh"})

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            expires=int(settings.REFRESH_TOKEN_EXPIRE_DAYS) * 24 * 60 * 60
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=None,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    async def verify_email_token(self, token: str) -> Dict[str, str]:
        try:
            user_data = self.token_serializer.loads(token, salt="email-verification", max_age=3600)
        except SignatureExpired:
            raise HTTPException(status_code=400, detail="Verification token has expired")
        except BadSignature:
            raise HTTPException(status_code=400, detail="Invalid verification token")

        if await UserSchema.find_by_email(user_data["email"]):
            return {"message": "Email already verified or in use"}
        
        if await UserSchema.find_by_username(user_data["username"]):
            raise HTTPException(status_code=400, detail="Username already taken")

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

    async def google_authenticate(self, request: GoogleAuthRequest, response: Response) -> TokenResponse:
        try:
            decoded_token = firebase_auth.verify_id_token(request.token)
            email = decoded_token.get("email")
            google_id = decoded_token.get("uid")
            name = decoded_token.get("name", "")
            
            if not email:
                raise HTTPException(status_code=400, detail="Email not provided by Firebase")
            
            user = await UserSchema.find_by_email(email.lower())
            
            if not user:
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
                    "auth_provider": "firebase",
                    "firebase_uid": google_id,
                    "display_name": name
                }
                
                user = await UserSchema.create(user_dict)
            else:
                if not user.get("firebase_uid"):
                    await UserSchema.update(
                        str(user["_id"]),
                        {
                            "firebase_uid": google_id,
                            "auth_provider": "firebase"
                        }
                    )

            access_token = create_access_token(data={"sub": str(user["_id"]),"type":"access"})
            refresh_token = create_refresh_token(data={"sub": str(user["_id"]),"type":"refresh"})

            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=True,
                samesite="none",
                path="/",
                expires=int(settings.REFRESH_TOKEN_EXPIRE_DAYS) * 24 * 60 * 60
            )
            
            return TokenResponse(
                access_token=access_token,
                refresh_token=None,
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            
        except FirebaseError as e:
            raise HTTPException(status_code=400, detail=f"Invalid Firebase token: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

    async def refresh_access_token(self, token_payload: dict, response: Response) -> TokenResponse:
        token_type = token_payload.get("type")
        user_id = token_payload.get("sub")

        if token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload"
            )

        user = await UserSchema.find_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        access_token = create_access_token(data={"sub": str(user["_id"]), "type": "access"})
        refresh_token = create_refresh_token(data={"sub": str(user["_id"]), "type": "refresh"})

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            expires=int(settings.REFRESH_TOKEN_EXPIRE_DAYS) * 24 * 60 * 60
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=None,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
