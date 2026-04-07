"""
Seed script  populates MongoDB Atlas + Cloudinary with demo data.
Run from the /server directory:  python seed.py
"""
import asyncio
import uuid
import sys
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Public-domain sample videos (small files from Google's sample bucket)
SAMPLE_VIDEOS = [
    {
        "title": "For Bigger Blazes",
        "description": "An explosive short clip showcasing cinematic fire effects used in modern action films.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        "thumb_src": "https://picsum.photos/seed/fire/640/360",
        "category": "Entertainment", "tags": ["action", "fire", "cinematic"],
    },
    {
        "title": "For Bigger Escapes",
        "description": "A thrilling chase sequence demonstrating high-speed cinematography in urban settings.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        "thumb_src": "https://picsum.photos/seed/escape/640/360",
        "category": "Entertainment", "tags": ["adventure", "chase", "urban"],
    },
    {
        "title": "For Bigger Fun",
        "description": "A fun and vibrant short showcasing colorful outdoor activities and extreme sports.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
        "thumb_src": "https://picsum.photos/seed/fun/640/360",
        "category": "Sports", "tags": ["fun", "sports", "outdoor"],
    },
    {
        "title": "For Bigger Joyrides",
        "description": "Experience the thrill of high-performance automobiles on winding mountain roads.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
        "thumb_src": "https://picsum.photos/seed/cars/640/360",
        "category": "Autos", "tags": ["cars", "driving", "speed"],
    },
    {
        "title": "For Bigger Meltdowns",
        "description": "Spectacular visual effects breakdown showing dramatic scene compositions.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
        "thumb_src": "https://picsum.photos/seed/vfx/640/360",
        "category": "Science & Tech", "tags": ["vfx", "effects", "film"],
    },
    {
        "title": "Subaru on Street and Dirt",
        "description": "Watch the Subaru Outback tackle both city streets and rugged off-road terrain with ease.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
        "thumb_src": "https://picsum.photos/seed/subaru/640/360",
        "category": "Autos", "tags": ["subaru", "offroad", "car review"],
    },
    {
        "title": "Elephant's Dream",
        "description": "The first open-source, professionally produced short film made entirely with Blender.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "thumb_src": "https://picsum.photos/seed/elephant/640/360",
        "category": "Film & Animation", "tags": ["blender", "animation", "open source"],
    },
    {
        "title": "Tears of Steel",
        "description": "A sci-fi short film about robots and humans battling in a dystopian Amsterdam.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
        "thumb_src": "https://picsum.photos/seed/steel/640/360",
        "category": "Film & Animation", "tags": ["sci-fi", "blender", "robots"],
    },
    {
        "title": "Volkswagen GTI Review",
        "description": "An in-depth performance review of the iconic Volkswagen GTI, the hot hatch benchmark.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
        "thumb_src": "https://picsum.photos/seed/gti/640/360",
        "category": "Autos", "tags": ["vw", "gti", "review"],
    },
    {
        "title": "We Are Going On Bullrun",
        "description": "Behind the scenes of the legendary Bullrun motorsport rally across America.",
        "video_src": "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
        "thumb_src": "https://picsum.photos/seed/bullrun/640/360",
        "category": "Sports", "tags": ["racing", "rally", "road trip"],
    },
]

USERS = [
    {"name": "Alex Rivera", "email": "alex@demo.com"},
    {"name": "Sam Chen", "email": "sam@demo.com"},
    {"name": "Jordan Lee", "email": "jordan@demo.com"},
    {"name": "Taylor Kim", "email": "taylor@demo.com"},
    {"name": "Morgan Patel", "email": "morgan@demo.com"},
]

COMMENTS = [
    "This is absolutely amazing! ",
    "Never gets old, watched it 10 times already.",
    "The production quality here is top notch.",
    "Subscribed immediately after watching this.",
    "Can you make a behind-the-scenes video?",
    "This deserves way more views!",
    "Incredible editing. What software do you use?",
    "This just made my day, thank you! ",
    "The soundtrack goes perfectly with the visuals.",
    "Shared this with my whole team, everyone loved it.",
]


async def upload_from_url(url: str, public_id: str, resource_type: str = "image") -> str:
    result = cloudinary.uploader.upload(
        url, public_id=public_id, resource_type=resource_type, overwrite=True
    )
    return result["secure_url"]


async def seed():
    print(" Starting seed...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client.youtube_clone

    # Clear existing data
    await db.users.delete_many({})
    await db.videos.delete_many({})
    await db.comments.delete_many({})
    print("  Cleared existing data")

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.videos.create_index([("title", "text"), ("description", "text"), ("tags", "text")])

    # Create users
    user_ids = []
    for i, u in enumerate(USERS):
        uid = str(uuid.uuid4())
        avatar_url = await upload_from_url(
            f"https://i.pravatar.cc/200?img={i + 10}",
            f"youtube_clone/avatars/{uid}",
        )
        doc = {
            "_id": uid, "name": u["name"], "email": u["email"],
            "password": pwd_context.hash("demo123"),
            "avatar": avatar_url, "subscribers": 0,
            "subscribed_to": [], "liked_videos": [],
            "disliked_videos": [], "history": [],
            "created_at": datetime.utcnow(),
        }
        await db.users.insert_one(doc)
        user_ids.append(uid)
        print(f"   Created user: {u['name']}")

    # Upload videos and create video docs
    video_ids = []
    for i, v in enumerate(SAMPLE_VIDEOS):
        vid_id = str(uuid.uuid4())
        print(f"   Uploading: {v['title']}...")
        try:
            video_url = await upload_from_url(
                v["video_src"], f"youtube_clone/videos/{vid_id}", resource_type="video"
            )
            thumb_url = await upload_from_url(
                v["thumb_src"], f"youtube_clone/thumbnails/{vid_id}"
            )
        except Exception as e:
            print(f"    Skipped {v['title']}: {e}")
            continue

        days_ago = i * 3
        doc = {
            "_id": vid_id, "title": v["title"], "description": v["description"],
            "tags": v["tags"], "thumbnail": thumb_url, "video_url": video_url,
            "duration": None, "views": (i + 1) * 1247 + i * 312,
            "likes": (i + 1) * 83, "dislikes": i * 4,
            "category": v["category"], "user_id": user_ids[i % len(user_ids)],
            "created_at": datetime.utcnow() - timedelta(days=days_ago),
        }
        await db.videos.insert_one(doc)
        video_ids.append(vid_id)
        print(f"   {v['title']}")

    # Add comments
    for i, vid_id in enumerate(video_ids):
        for j in range(3):
            cid = str(uuid.uuid4())
            await db.comments.insert_one({
                "_id": cid,
                "video_id": vid_id,
                "user_id": user_ids[(i + j) % len(user_ids)],
                "text": COMMENTS[(i * 3 + j) % len(COMMENTS)],
                "likes": j * 5, "liked_by": [], "parent_id": None,
                "created_at": datetime.utcnow() - timedelta(hours=j * 4),
            })

    # Update subscriber counts (cross-subscribe users)
    for i, uid in enumerate(user_ids):
        subs = [user_ids[(i + 1) % len(user_ids)], user_ids[(i + 2) % len(user_ids)]]
        await db.users.update_one({"_id": uid}, {"$set": {"subscribed_to": subs}})
    for uid in user_ids:
        count = await db.users.count_documents({"subscribed_to": uid})
        await db.users.update_one({"_id": uid}, {"$set": {"subscribers": count}})

    client.close()
    print(f"\n Seed complete! {len(user_ids)} users, {len(video_ids)} videos, {len(video_ids) * 3} comments.")
    print("   Demo login  email: alex@demo.com  password: demo123")


if __name__ == "__main__":
    asyncio.run(seed())
