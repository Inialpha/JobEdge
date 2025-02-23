from fastapi import APIRouter, Depends, HTTPException
from storage.database import get_db, DBStorage
from models.user import User
from schemas.users import UserCreate, UserResponse
from typing import List
import uuid

router = APIRouter(prefix="/users", tags=["Users"])

# Create a new user
@router.post("/", response_model=UserResponse)
def create_user(user_data: UserCreate, storage: DBStorage = Depends(get_db)):
    existing_user = storage.get_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        password=user_data.password  # Hash this in production
    )

    storage.new(new_user)
    return new_user

# Get all users
@router.get("/", response_model=List[UserResponse])
def get_all_users(storage: DBStorage = Depends(get_db)):
    users = storage.all(User)
    return users

# Get a user by ID
@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: uuid.UUID, storage: DBStorage = Depends(get_db)):
    user = storage.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Update a user
@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: uuid.UUID, user_data: UserCreate, storage: DBStorage = Depends(get_db)):
    user = storage.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user fields
    user.first_name = user_data.first_name
    user.last_name = user_data.last_name
    user.email = user_data.email
    user.password = user_data.password  # Hash this in production

    storage.save()
    return user

# Delete a user
@router.delete("/{user_id}")
def delete_user(user_id: uuid.UUID, storage: DBStorage = Depends(get_db)):
    user = storage.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    storage.delete(user)
    return {"message": "User deleted successfully"}
