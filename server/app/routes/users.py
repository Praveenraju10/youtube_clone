from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
import cloudinary
import cloudinary.uploader
from app.database import get_db
from app.middleware.auth_middleware import get_current_user
from app.config import settings

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    u = dict(current_user)
    u["id"] = u["_id"]
    del u["_id"]
    u.pop("password", None)
    return u


@router.get("/{user_id}")
async def get_user(user_id: str, db=Depends(get_db)):
    user = await db.users.find_one({"_id": user_id}, {"password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user["id"] = user["_id"]
    del user["_id"]
    return user


@router.put("/{user_id}")
async def update_user(
    user_id: str,
    name: str = Form(None),
    avatar: UploadFile = File(None),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    if current_user["_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    update = {}
    if name:
        update["name"] = name
    if avatar and avatar.filename:
        content = await avatar.read()
        result = cloudinary.uploader.upload(
            content,
            public_id=f"youtube_clone/avatars/{user_id}",
            overwrite=True,
            transformation=[{"width": 200, "height": 200, "crop": "fill"}],
        )
        update["avatar"] = result["secure_url"]
    if update:
        await db.users.update_one({"_id": user_id}, {"$set": update})
    updated = await db.users.find_one({"_id": user_id}, {"password": 0})
    updated["id"] = updated["_id"]
    del updated["_id"]
    return updated


@router.put("/{channel_id}/subscribe")
async def subscribe(channel_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = current_user["_id"]
    if uid == channel_id:
        raise HTTPException(status_code=400, detail="Cannot subscribe to yourself")
    await db.users.update_one({"_id": uid}, {"$addToSet": {"subscribed_to": channel_id}})
    await db.users.update_one({"_id": channel_id}, {"$inc": {"subscribers": 1}})
    return {"message": "Subscribed"}


@router.put("/{channel_id}/unsubscribe")
async def unsubscribe(channel_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = current_user["_id"]
    if channel_id not in current_user.get("subscribed_to", []):
        raise HTTPException(status_code=400, detail="Not subscribed")
    await db.users.update_one({"_id": uid}, {"$pull": {"subscribed_to": channel_id}})
    await db.users.update_one({"_id": channel_id}, {"$inc": {"subscribers": -1}})
    return {"message": "Unsubscribed"}


@router.get("/{user_id}/videos")
async def get_user_videos(user_id: str, db=Depends(get_db)):
    cursor = db.videos.find({"user_id": user_id}).sort("created_at", -1)
    videos = await cursor.to_list(length=100)
    result = []
    for v in videos:
        v["id"] = v["_id"]
        del v["_id"]
        result.append(v)
    return result


@router.get("/{user_id}/history")
async def get_history(user_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    if current_user["_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    history_ids = current_user.get("history", [])[-50:]
    videos = []
    for vid_id in reversed(history_ids):
        v = await db.videos.find_one({"_id": vid_id})
        if v:
            user = await db.users.find_one({"_id": v["user_id"]}, {"name": 1, "avatar": 1})
            v["id"] = v["_id"]
            del v["_id"]
            v["channel_name"] = user["name"] if user else "Unknown"
            v["channel_avatar"] = user.get("avatar") if user else None
            videos.append(v)
    return videos
