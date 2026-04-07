import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
import cloudinary
import cloudinary.uploader
from app.database import get_db
from app.config import settings
from app.middleware.auth_middleware import get_current_user, get_optional_user

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
)

router = APIRouter(prefix="/api/videos", tags=["videos"])


async def enrich_videos(videos: list, db) -> list:
    result = []
    for v in videos:
        user = await db.users.find_one({"_id": v["user_id"]}, {"name": 1, "avatar": 1})
        v["id"] = v["_id"]
        del v["_id"]
        v["channel_name"] = user["name"] if user else "Unknown"
        v["channel_avatar"] = user.get("avatar") if user else None
        result.append(v)
    return result


@router.get("/")
async def get_videos(
    search: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = Query(20, le=50),
    skip: int = 0,
    db=Depends(get_db),
):
    query = {}
    if search:
        query["$text"] = {"$search": search}
    if category and category != "All":
        query["category"] = category
    cursor = db.videos.find(query).sort("created_at", -1).skip(skip).limit(limit)
    videos = await cursor.to_list(length=limit)
    return await enrich_videos(videos, db)


@router.get("/trending")
async def get_trending(db=Depends(get_db)):
    cursor = db.videos.find({}).sort("views", -1).limit(20)
    videos = await cursor.to_list(length=20)
    return await enrich_videos(videos, db)


@router.get("/subscriptions")
async def get_subscriptions(current_user=Depends(get_current_user), db=Depends(get_db)):
    ids = current_user.get("subscribed_to", [])
    cursor = db.videos.find({"user_id": {"$in": ids}}).sort("created_at", -1).limit(30)
    videos = await cursor.to_list(length=30)
    return await enrich_videos(videos, db)


@router.get("/liked")
async def get_liked(current_user=Depends(get_current_user), db=Depends(get_db)):
    ids = current_user.get("liked_videos", [])
    if not ids:
        return []
    cursor = db.videos.find({"_id": {"$in": ids}})
    videos = await cursor.to_list(length=50)
    return await enrich_videos(videos, db)


@router.get("/{video_id}")
async def get_video(video_id: str, db=Depends(get_db)):
    video = await db.videos.find_one({"_id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    user = await db.users.find_one({"_id": video["user_id"]}, {"name": 1, "avatar": 1, "subscribers": 1})
    video["id"] = video["_id"]
    del video["_id"]
    video["channel_name"] = user["name"] if user else "Unknown"
    video["channel_avatar"] = user.get("avatar") if user else None
    video["channel_subscribers"] = user.get("subscribers", 0) if user else 0
    return video


@router.post("/", status_code=201)
async def upload_video(
    title: str = Form(...),
    description: str = Form(...),
    tags: str = Form(""),
    category: str = Form("General"),
    video: UploadFile = File(...),
    thumbnail: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    video_id = str(uuid.uuid4())
    video_bytes = await video.read()
    thumb_bytes = await thumbnail.read()

    video_result = cloudinary.uploader.upload(
        video_bytes, resource_type="video",
        public_id=f"youtube_clone/videos/{video_id}",
    )
    thumb_result = cloudinary.uploader.upload(
        thumb_bytes, public_id=f"youtube_clone/thumbnails/{video_id}",
    )
    tags_list = [t.strip() for t in tags.split(",") if t.strip()]
    doc = {
        "_id": video_id, "title": title, "description": description,
        "tags": tags_list, "thumbnail": thumb_result["secure_url"],
        "video_url": video_result["secure_url"],
        "duration": video_result.get("duration"),
        "views": 0, "likes": 0, "dislikes": 0,
        "category": category, "user_id": current_user["_id"],
        "created_at": datetime.utcnow(),
    }
    await db.videos.insert_one(doc)
    doc["id"] = doc["_id"]
    del doc["_id"]
    return doc


@router.put("/{video_id}/view")
async def increment_view(video_id: str, current_user=Depends(get_optional_user), db=Depends(get_db)):
    res = await db.videos.update_one({"_id": video_id}, {"$inc": {"views": 1}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Video not found")
    if current_user:
        await db.users.update_one({"_id": current_user["_id"]}, {"$addToSet": {"history": video_id}})
    return {"message": "View counted"}


@router.put("/{video_id}/like")
async def like_video(video_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = current_user["_id"]
    liked = current_user.get("liked_videos", [])
    disliked = current_user.get("disliked_videos", [])
    if video_id in liked:
        await db.videos.update_one({"_id": video_id}, {"$inc": {"likes": -1}})
        await db.users.update_one({"_id": uid}, {"$pull": {"liked_videos": video_id}})
        return {"action": "unliked"}
    inc = {"likes": 1}
    if video_id in disliked:
        inc["dislikes"] = -1
        await db.users.update_one({"_id": uid}, {"$pull": {"disliked_videos": video_id}})
    await db.videos.update_one({"_id": video_id}, {"$inc": inc})
    await db.users.update_one({"_id": uid}, {"$addToSet": {"liked_videos": video_id}})
    return {"action": "liked"}


@router.put("/{video_id}/dislike")
async def dislike_video(video_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = current_user["_id"]
    liked = current_user.get("liked_videos", [])
    disliked = current_user.get("disliked_videos", [])
    if video_id in disliked:
        await db.videos.update_one({"_id": video_id}, {"$inc": {"dislikes": -1}})
        await db.users.update_one({"_id": uid}, {"$pull": {"disliked_videos": video_id}})
        return {"action": "removed_dislike"}
    inc = {"dislikes": 1}
    if video_id in liked:
        inc["likes"] = -1
        await db.users.update_one({"_id": uid}, {"$pull": {"liked_videos": video_id}})
    await db.videos.update_one({"_id": video_id}, {"$inc": inc})
    await db.users.update_one({"_id": uid}, {"$addToSet": {"disliked_videos": video_id}})
    return {"action": "disliked"}


@router.delete("/{video_id}")
async def delete_video(video_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    video = await db.videos.find_one({"_id": video_id})
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    try:
        cloudinary.uploader.destroy(f"youtube_clone/videos/{video_id}", resource_type="video")
        cloudinary.uploader.destroy(f"youtube_clone/thumbnails/{video_id}")
    except Exception:
        pass
    await db.videos.delete_one({"_id": video_id})
    await db.comments.delete_many({"video_id": video_id})
    return {"message": "Video deleted"}
