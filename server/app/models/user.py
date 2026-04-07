from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: Optional[str] = None
    subscribers: int = 0
    subscribed_to: List[str] = []
    created_at: datetime


class UserInDB(BaseModel):
    id: Optional[str] = None
    name: str
    email: str
    password: str
    avatar: Optional[str] = None
    subscribers: int = 0
    subscribed_to: List[str] = []
    liked_videos: List[str] = []
    disliked_videos: List[str] = []
    history: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
