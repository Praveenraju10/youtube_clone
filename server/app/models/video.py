from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class VideoResponse(BaseModel):
    id: str
    title: str
    description: str
    tags: List[str]
    thumbnail: str
    video_url: str
    duration: Optional[float] = None
    views: int
    likes: int
    dislikes: int
    category: str
    user_id: str
    channel_name: Optional[str] = None
    channel_avatar: Optional[str] = None
    created_at: datetime


class VideoInDB(BaseModel):
    id: Optional[str] = None
    title: str
    description: str
    tags: List[str] = []
    thumbnail: str
    video_url: str
    duration: Optional[float] = None
    views: int = 0
    likes: int = 0
    dislikes: int = 0
    category: str = "General"
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
