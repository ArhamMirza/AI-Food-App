from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserUpdate, UserResponse
from app.schemas.user_schema import UserSchema
from app.api.deps import get_current_active_user
from pymongo.errors import PyMongoError, DuplicateKeyError  # Assuming you're using PyMongo or Motor

router = APIRouter()

@router.put("/update", response_model=UserResponse)
async def update_user(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_active_user),
):
    user_id = str(current_user["_id"])

    # Check if no update fields were provided
    data = update_data.dict(exclude_unset=True)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No update fields provided"
        )

    # Normalize username
    if "username" in data:
        data["username"] = data["username"].strip().lower()

    try:
        updated = await UserSchema.update(user_id=user_id, update_data=data)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists"
        )
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User update failed"
        )

    updated_user = await UserSchema.find_by_id(user_id)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found after update"
        )

    updated_user["id"] = str(updated_user["_id"])

    return UserResponse(**updated_user)
