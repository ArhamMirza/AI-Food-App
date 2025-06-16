from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, List
from app.models.meal import (
    MealPlanCreateRequest,
    MealPlanUpdateRequest,
    MealPlanResponse,
    MealPlanListResponse,
    MealPlanSingleResponse,
    MealPlanWeekRequest
)
from app.schemas.meal_schema import MealPlanSchema
from datetime import datetime, timedelta  


router = APIRouter()

def document_to_meal_plan_response(doc: Dict[str, Any]) -> MealPlanResponse:
    """Convert MongoDB document to MealPlanResponse model"""
    return MealPlanResponse(
        meal_plan_id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        date=doc["date"],
        meal_type=doc["meal_type"],
        recipe_id=str(doc["recipe_id"]) if doc.get("recipe_id") else None,
        recipe_title=doc.get("recipe_title"),
        custom_meal=doc.get("custom_meal"),
        notes=doc.get("notes"),
        # created_at=doc.get("created_at"),
        # updated_at=doc.get("updated_at")
    )

@router.post("/", response_model=MealPlanSingleResponse)
async def create_meal_plan(request: MealPlanCreateRequest):
    """
    Create a new meal plan.

    Args:
        request: Meal plan creation request with required fields

    Returns:
        Created meal plan details
    """
    try:
        meal_plan_data = request.model_dump(exclude_unset=True)
        meal_plan = await MealPlanSchema.create(meal_plan_data)
        if not meal_plan:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create meal plan"
            )
        return MealPlanSingleResponse(
            success=True,
            data=document_to_meal_plan_response(meal_plan),
            message="Meal plan created successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/user/{user_id}", response_model=MealPlanListResponse)
async def get_meal_plans_by_user(user_id: str):
    """
    Get all meal plans for a given user.

    Args:
        user_id: ID of the user

    Returns:
        List of meal plans
    """
    try:
        meal_plans = await MealPlanSchema.find_by_user_id(user_id)
        return MealPlanListResponse(
            success=True,
            data=[document_to_meal_plan_response(doc) for doc in meal_plans],
            message="Meal plans retrieved successfully"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.get("/{meal_plan_id}", response_model=MealPlanSingleResponse)
async def get_meal_plan_by_id(meal_plan_id: str):
    """
    Get a specific meal plan by its ID.

    Args:
        meal_plan_id: ID of the meal plan

    Returns:
        Single meal plan details
    """
    try:
        meal_plan = await MealPlanSchema.find_by_id(meal_plan_id)
        if not meal_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meal plan not found"
            )
        return MealPlanSingleResponse(
            success=True,
            data=document_to_meal_plan_response(meal_plan),
            message="Meal plan retrieved successfully"
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.put("/{meal_plan_id}", response_model=MealPlanSingleResponse)
async def update_meal_plan(meal_plan_id: str, request: MealPlanUpdateRequest):
    """
    Update an existing meal plan.

    Args:
        meal_plan_id: ID of the meal plan
        request: Meal plan update request with optional fields

    Returns:
        Updated meal plan details
    """
    try:
        update_data = request.model_dump(exclude_unset=True)
        meal_plan = await MealPlanSchema.update(meal_plan_id, update_data)
        if not meal_plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meal plan not found or update failed"
            )
        return MealPlanSingleResponse(
            success=True,
            data=document_to_meal_plan_response(meal_plan),
            message="Meal plan updated successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.delete("/{meal_plan_id}", response_model=Dict[str, Any])
async def delete_meal_plan(meal_plan_id: str):
    """
    Delete a meal plan by its ID.

    Args:
        meal_plan_id: ID of the meal plan

    Returns:
        Success status
    """
    try:
        success = await MealPlanSchema.delete(meal_plan_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Meal plan not found"
            )
        return {
            "success": True,
            "message": "Meal plan deleted successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )

@router.post("/week", response_model=MealPlanListResponse)
async def get_meal_plans_for_week(request: MealPlanWeekRequest):
    """
    Get meal plans for a user within a week.

    Args:
        request: Request with user_id and date range

    Returns:
        List of meal plans for the specified week
    """
    try:
        # If end_date is not provided, calculate it as 6 days after start_date
        start_date = request.start_date
        end_date = request.end_date or (
            datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=6)
        ).strftime("%Y-%m-%d")
        
        meal_plans = await MealPlanSchema.find_by_date_range(
            user_id=request.user_id,
            start_date=start_date,
            end_date=end_date
        )
        return MealPlanListResponse(
            success=True,
            data=[document_to_meal_plan_response(doc) for doc in meal_plans],
            message="Meal plans for week retrieved successfully"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}"
        )