from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import UserUpdate, UserResponse
from app.schemas.user_schema import UserSchema
from app.api.deps import get_current_active_user

router = APIRouter()

@router.put("/update", response_model=UserResponse)
async def update_user(
    update_data: UserUpdate,
    current_user: dict = Depends(get_current_active_user),
):
    user_id = str(current_user["_id"])
    
    # Convert Pydantic model to dictionary
    data = update_data.dict(exclude_unset=True)

    # Normalize the username if it's present
    if "username" in data:
        data["username"] = data["username"].lower()

    updated = await UserSchema.update(user_id=user_id, update_data=data)

    if not updated:
        raise HTTPException(status_code=400, detail="User update failed")

    updated_user = await UserSchema.find_by_id(user_id)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Set 'id' field for response compatibility
    updated_user["id"] = str(updated_user["_id"])

    return UserResponse(**updated_user)
