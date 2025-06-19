from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"

class DietaryRestriction(str, Enum):
    VEGETARIAN = "Vegetarian"
    VEGAN = "Vegan"
    GLUTEN_FREE = "Gluten_free"
    DAIRY_FREE = "Dairy_free"
    NUT_FREE = "Nut_free"
    KETO = "Keto"
    PALEO = "Paleo"
    HALAL = "Halal"
    KOSHER = "Kosher"

class UserPreferences(BaseModel):
    dietary_restrictions: List[DietaryRestriction] = []
    allergies: List[str] = []
    favorite_cuisines: List[str] = []
    disliked_ingredients: List[str] = []
    cooking_skill_level: Optional[str] = "beginner"
    preferred_meal_prep_time: Optional[int] = None

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    
    @validator('username')
    def validate_username(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, hyphens, and underscores')
        return v.lower()

class UserUpdate(BaseModel):
    username: Optional[str] = None
    preferences: Optional[UserPreferences] = None

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    is_email_verified: bool
    role: UserRole
    preferences: Optional[UserPreferences] = None
    saved_recipes: List[str] = []
    shopping_lists: List[str] = []
    meal_plans: List[str] = []
    created_at: datetime
    
    class Config:
        from_attributes = True
