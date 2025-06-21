import logging
import os
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List, Union
import base64
import hashlib
import json
from app.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Custom exceptions
class EncryptionError(Exception):
    """Base exception for encryption-related errors"""
    pass

class KeyGenerationError(EncryptionError):
    """Raised when key generation fails"""
    pass

class MessageEncryptionError(EncryptionError):
    """Raised when message encryption/decryption fails"""
    pass

class TokenVerificationError(Exception):
    """Raised when token verification fails"""
    pass

# Global debug flag (can be set via environment variable or settings)
DEBUG_MODE = getattr(settings, 'DEBUG_MODE', False)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        if not plain_password or not hashed_password:
            logger.error("Empty password or hash provided")
            raise ValueError("Password or hash cannot be empty")
        verified = pwd_context.verify(plain_password, hashed_password)
        if DEBUG_MODE:
            logger.debug(f"Password verification {'successful' if verified else 'failed'}")
        return verified
    except Exception as e:
        logger.error(f"Password verification failed: {str(e)}", exc_info=DEBUG_MODE)
        raise

def get_password_hash(password: str) -> str:
    try:
        if not password:
            logger.error("Empty password provided for hashing")
            raise ValueError("Password cannot be empty")
        hashed = pwd_context.hash(password)
        if DEBUG_MODE:
            logger.debug(f"Password hashed successfully, length: {len(hashed)}")
        return hashed
    except Exception as e:
        logger.error(f"Password hashing failed: {str(e)}", exc_info=DEBUG_MODE)
        raise

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        to_encode.update({"exp": expire})
        token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        if DEBUG_MODE:
            logger.debug(f"Access token created, expires: {expire}")
        return token
    except Exception as e:
        logger.error(f"Access token creation failed: {str(e)}", exc_info=DEBUG_MODE)
        raise TokenVerificationError(f"Failed to create access token: {str(e)}")

def create_refresh_token(data: dict):
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire})
        token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        if DEBUG_MODE:
            logger.debug(f"Refresh token created, expires: {expire}")
        return token
    except Exception as e:
        logger.error(f"Refresh token creation failed: {str(e)}", exc_info=DEBUG_MODE)
        raise TokenVerificationError(f"Failed to create refresh token: {str(e)}")

def verify_token(token: str) -> Optional[dict]:
    try:
        if not token:
            logger.error("Empty token provided for verification")
            raise ValueError("Token cannot be empty")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if DEBUG_MODE:
            logger.debug(f"Token verified successfully: {payload.get('sub', 'no-sub')}")
        return payload
    except JWTError as e:
        logger.error(f"Token verification failed: {str(e)}", exc_info=DEBUG_MODE)
        return None
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {str(e)}", exc_info=DEBUG_MODE)
        raise TokenVerificationError(f"Token verification error: {str(e)}")

