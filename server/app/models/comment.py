from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class CommentCreate(BaseModel):
    video_id: str
    text: str
    parent_id: Optional[str] = None


class CommentResponse(BaseModel):
    id: str
    video_id: str
    user_id: str
    user_name: str
    user_avatar: Optional[str] = None
    text: str
    likes: int
    liked_by: List[str]
    parent_id: Optional[str]
    replies: List[dict] = []
    created_at: datetime


class CommentInDB(BaseModel):
    id: Optional[str] = None
    video_id: str
    user_id: str
    text: str
    likes: int = 0
    liked_by: List[str] = []
    parent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
