from pydantic import BaseModel, Field
from typing import Optional, List, Union


class RecipeSearchRequest(BaseModel):
    recipe_query: str = Field(..., description="Recipe search term")
    cuisine_type: Optional[str] = Field(None, description="Type of cuisine (e.g., Italian, Chinese)")
    meal_type: Optional[str] = Field(None, description="Type of meal (e.g., breakfast, lunch, dinner)")
    diet: Optional[str] = Field(None, description="Dietary restriction (e.g., vegetarian, vegan)")
    health: Optional[str] = Field(None, description="Health consideration (e.g., low-carb, gluten-free)")
    multiple: bool = Field(False, description="Whether to return multiple recipes")

class RecipeSearchResponse(BaseModel):
    success: bool
    data: str
    message: Optional[str] = None