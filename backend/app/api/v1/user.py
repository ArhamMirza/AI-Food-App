from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserUpdate, UserResponse
from app.schemas.user_schema import UserSchema
from app.api.deps import get_current_active_user
from pymongo.errors import PyMongoError, DuplicateKeyError

router = APIRouter()

@router.put("/update", response_model=UserResponse)
async def update_user(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_active_user),
):
    user_id = str(current_user["_id"])
    data = update_data.dict(exclude_unset=True)

    if not data:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "no_update_fields",
                "message": "No update fields were provided in the request body.",
                "fields": []
            }
        )

    if "username" in data:
        data["username"] = data["username"].strip().lower()

    try:
        updated = await UserSchema.update(user_id=user_id, update_data=data)
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "duplicate_key",
                "message": "Username or email already exists.",
                "fields": ["username", "email"]
            }
        )
    except PyMongoError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "db_error",
                "message": "A database error occurred.",
                "error": str(e)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "code": "unexpected_error",
                "message": "An unexpected error occurred.",
                "error": str(e)
            }
        )

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "update_failed",
                "message": "User update failed. No changes were applied.",
                "fields": list(data.keys())
            }
        )

    updated_user = await UserSchema.find_by_id(user_id)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "user_not_found",
                "message": "User not found after update.",
                "user_id": user_id
            }
        )

    updated_user["id"] = str(updated_user["_id"])
    return UserResponse(**updated_user)
