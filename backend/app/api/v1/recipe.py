from fastapi import APIRouter, Depends, BackgroundTasks
from fastapi import HTTPException, status
import json
from app.models.recipe import RecipeSearchRequest, RecipeSearchResponse
from app.services.recipe_service import handle_recipe_function_call

router = APIRouter()

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
        print(result)
        
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