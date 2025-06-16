from pydantic import BaseModel, Field
from typing import Optional, Dict, List, Any, Union
from datetime import date, datetime

class MealPlanBase(BaseModel):
    """Base model for meal plans"""
    date: str = Field(..., description="Date of the meal plan (YYYY-MM-DD)")
    meal_type: str = Field(..., description="Type of meal (breakfast, lunch, dinner, snack)")

class MealPlanCreateRequest(MealPlanBase):
    """Request model for creating a meal plan"""
    user_id: str = Field(..., description="ID of the user")
    recipe_id: Optional[str] = Field(None, description="ID of the recipe (if not a custom meal)")
    recipe_title: Optional[str] = Field(None, description="Title of the recipe (if not a custom meal)")
    # custom_meal: Optional[str] = Field(None, description="Custom meal description (if not using a recipe)")
    notes: Optional[str] = Field(None, description="Additional notes for the meal plan")

class MealPlanUpdateRequest(BaseModel):
    """Request model for updating a meal plan"""
    date: Optional[str] = Field(None, description="Date of the meal plan (YYYY-MM-DD)")
    meal_type: Optional[str] = Field(None, description="Type of meal (breakfast, lunch, dinner, snack)")
    recipe_id: Optional[str] = Field(None, description="ID of the recipe (if not a custom meal)")
    recipe_title: Optional[str] = Field(None, description="Title of the recipe (if not a custom meal)")
    # custom_meal: Optional[str] = Field(None, description="Custom meal description (if not using a recipe)")
    notes: Optional[str] = Field(None, description="Additional notes for the meal plan")

class MealPlanResponse(MealPlanBase):
    """Response model for a meal plan"""
    meal_plan_id: str = Field(..., description="ID of the meal plan")
    user_id: str = Field(..., description="ID of the user")
    recipe_id: Optional[str] = Field(None, description="ID of the recipe (if not a custom meal)")
    recipe_title: Optional[str] = Field(None, description="Title of the recipe (if not a custom meal)")
    # custom_meal: Optional[str] = Field(None, description="Custom meal description (if not using a recipe)")
    notes: Optional[str] = Field(None, description="Additional notes for the meal plan")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

class MealPlanListResponse(BaseModel):
    """Response model for a list of meal plans"""
    success: bool = Field(..., description="Whether the request was successful")
    data: List[MealPlanResponse] = Field(..., description="List of meal plans")
    message: str = Field(..., description="Response message")

class MealPlanSingleResponse(BaseModel):
    """Response model for a single meal plan"""
    success: bool = Field(..., description="Whether the request was successful")
    data: Optional[MealPlanResponse] = Field(None, description="Meal plan data")
    message: str = Field(..., description="Response message")

class MealPlanWeekRequest(BaseModel):
    """Request model for getting meal plans for a week"""
    user_id: str = Field(..., description="ID of the user")
    start_date: str = Field(..., description="Start date of the week (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date of the week (YYYY-MM-DD)")