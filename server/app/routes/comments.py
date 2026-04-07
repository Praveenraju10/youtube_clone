import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.models.comment import CommentCreate
from app.database import get_db
from app.middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/comments", tags=["comments"])


async def format_comment(c: dict, db) -> dict:
    user = await db.users.find_one({"_id": c["user_id"]}, {"name": 1, "avatar": 1})
    c["id"] = c["_id"]
    del c["_id"]
    c["user_name"] = user["name"] if user else "Unknown"
    c["user_avatar"] = user.get("avatar") if user else None
    return c


@router.get("/{video_id}")
async def get_comments(video_id: str, db=Depends(get_db)):
    cursor = db.comments.find({"video_id": video_id, "parent_id": None}).sort("created_at", -1)
    comments = await cursor.to_list(length=100)
    result = []
    for c in comments:
        c = await format_comment(c, db)
        replies_cursor = db.comments.find({"parent_id": c["id"]}).sort("created_at", 1)
        replies_raw = await replies_cursor.to_list(length=50)
        c["replies"] = [await format_comment(r, db) for r in replies_raw]
        result.append(c)
    return result


@router.post("/", status_code=201)
async def post_comment(data: CommentCreate, current_user=Depends(get_current_user), db=Depends(get_db)):
    comment_id = str(uuid.uuid4())
    doc = {
        "_id": comment_id,
        "video_id": data.video_id,
        "user_id": current_user["_id"],
        "text": data.text,
        "likes": 0,
        "liked_by": [],
        "parent_id": data.parent_id,
        "created_at": datetime.utcnow(),
    }
    await db.comments.insert_one(doc)
    doc = await format_comment(doc, db)
    doc["replies"] = []
    return doc


@router.put("/{comment_id}/like")
async def like_comment(comment_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    uid = current_user["_id"]
    c = await db.comments.find_one({"_id": comment_id})
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    if uid in c.get("liked_by", []):
        await db.comments.update_one({"_id": comment_id}, {"$inc": {"likes": -1}, "$pull": {"liked_by": uid}})
        return {"action": "unliked"}
    await db.comments.update_one({"_id": comment_id}, {"$inc": {"likes": 1}, "$addToSet": {"liked_by": uid}})
    return {"action": "liked"}


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    c = await db.comments.find_one({"_id": comment_id})
    if not c:
        raise HTTPException(status_code=404, detail="Comment not found")
    if c["user_id"] != current_user["_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    await db.comments.delete_one({"_id": comment_id})
    await db.comments.delete_many({"parent_id": comment_id})
    return {"message": "Comment deleted"}
