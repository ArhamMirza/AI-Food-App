from fastapi import APIRouter, Depends, BackgroundTasks
from typing import Dict, Any, List
from datetime import datetime
from fastapi import HTTPException, status
import json
from app.models.recipe import RecipeSearchRequest, RecipeSearchResponse, RecipeResponse, RecipeListResponse
from app.schemas.recipe_schema import RecipeSchema
from app.services.recipe_service import handle_recipe_function_call
from app.config import settings

router = APIRouter()

def document_to_recipe_response(doc: Dict[str, Any]) -> RecipeResponse:
    return RecipeResponse(
        recipe_id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        title=doc["title"],
        content=doc["content"],
        # created_at=doc.get("created_at"),
        # updated_at=doc.get("updated_at")
    )

@router.post("/search", response_model=RecipeSearchResponse)
async def search_recipes(request: RecipeSearchRequest):
    """
    Search for recipes based on query and optional filters.
    
    Args:
        request: Recipe search request with query and filters
    
    Returns:
        Recipe search results
    """
    try:
        # Convert request to JSON string for the existing function
        arguments_dict = request.model_dump()
        arguments_json = json.dumps(arguments_dict)
        
        # logger.info(f"Searching recipes with query: {request.recipe_query}")
        
        # Call the existing function
        result = handle_recipe_function_call(arguments_json)
        
        # Check if result indicates an error
        if result.startswith("Error") or result.startswith("Please provide"):
            return RecipeSearchResponse(
                success=False,
                data="",
                message=result
            )
        
        return RecipeSearchResponse(
            success=True,
            data=result,
            message="Recipe search completed successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/user/{user_id}", response_model=RecipeListResponse)
async def get_recipes_by_user(user_id: str):
    """
    Get all recipes for a given user.

    Args:
        user_id: ID of the user

    Returns:
        List of recipes
    """
    try:
        recipes = await RecipeSchema.find_by_user_id(user_id)
        return RecipeListResponse(
            success=True,
            data=[document_to_recipe_response(doc) for doc in recipes],
            message="Recipes retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
@router.get("/{recipe_id}", response_model=RecipeSearchResponse)
async def get_recipe_by_id(recipe_id: str):
    """
    Get a specific recipe by its ID.

    Args:
        recipe_id: ID of the recipe

    Returns:
        Single recipe details
    """
    try:
    
        recipe = await RecipeSchema.find_by_id(recipe_id)
        print(document_to_recipe_response(recipe))
        if not recipe:
            raise HTTPException(
                status_code=404,
                detail="Recipe not found"
            )
        return RecipeSearchResponse(
            success=True,
            data=document_to_recipe_response(recipe),
            message="Recipe retrieved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}"
        )
    
from fastapi import Body

@router.put("/{recipe_id}", response_model=RecipeSearchResponse)
async def update_recipe(recipe_id: str, body: Dict[str, Any] = Body(...)):
    """
    Update a recipe's title and content by its ID.

    Args:
        recipe_id: ID of the recipe
        body: JSON with updated 'title' and 'content'

    Returns:
        RecipeSearchResponse with updated recipe data
    """
    try:
        title = body.get("title", "").strip()
        content = body.get("content", "").strip()

        if not title or not content:
            raise HTTPException(status_code=400, detail="Title and content must not be empty")

        update_data = {
            "title": title,
            "content": {"text": content}
        }

        updated = await RecipeSchema.update(recipe_id, update_data)

        if not updated:
            raise HTTPException(status_code=404, detail="Recipe not found or not updated")

        updated_recipe = await RecipeSchema.find_by_id(recipe_id)

        return RecipeSearchResponse(
            success=True,
            data=document_to_recipe_response(updated_recipe),
            message="Recipe updated successfully"
        )

    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
