import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, status
from jose import jwt, JWTError
from passlib.context import CryptContext
from app.models.user import UserCreate, UserLogin
from app.database import get_db
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    return jwt.encode({"sub": user_id, "exp": expire}, settings.secret_key, algorithm=settings.algorithm)


def create_refresh_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=settings.refresh_token_expire_days)
    return jwt.encode({"sub": user_id, "exp": expire, "type": "refresh"}, settings.secret_key, algorithm=settings.algorithm)


@router.post("/register", status_code=201)
async def register(user_data: UserCreate, db=Depends(get_db)):
    if await db.users.find_one({"email": user_data.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    doc = {
        "_id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "avatar": None,
        "subscribers": 0,
        "subscribed_to": [],
        "liked_videos": [],
        "disliked_videos": [],
        "history": [],
        "created_at": datetime.utcnow(),
    }
    await db.users.insert_one(doc)
    return {
        "access_token": create_access_token(user_id),
        "refresh_token": create_refresh_token(user_id),
        "token_type": "bearer",
        "user": {
            "id": user_id, 
            "name": user_data.name, 
            "email": user_data.email, 
            "avatar": None, 
            "subscribers": 0,
            "subscribed_to": [],
            "liked_videos": [],
            "disliked_videos": [],
        },
    }


@router.post("/login")
async def login(user_data: UserLogin, db=Depends(get_db)):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "access_token": create_access_token(user["_id"]),
        "refresh_token": create_refresh_token(user["_id"]),
        "token_type": "bearer",
        "user": {
            "id": user["_id"], 
            "name": user["name"], 
            "email": user["email"], 
            "avatar": user.get("avatar"), 
            "subscribers": user.get("subscribers", 0),
            "subscribed_to": user.get("subscribed_to", []),
            "liked_videos": user.get("liked_videos", []),
            "disliked_videos": user.get("disliked_videos", []),
        },
    }


@router.post("/refresh")
async def refresh(body: dict, db=Depends(get_db)):
    token = body.get("refresh_token")
    if not token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        user = await db.users.find_one({"_id": payload.get("sub")})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"access_token": create_access_token(user["_id"]), "token_type": "bearer"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
