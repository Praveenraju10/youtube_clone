from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings


class Database:
    client: AsyncIOMotorClient = None
    db = None


db_instance = Database()


async def connect_db():
    db_instance.client = AsyncIOMotorClient(
        settings.mongodb_url,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
    )
    db_instance.db = db_instance.client.youtube_clone
    print("[OK] MongoDB client initialised")


async def create_indexes():
    """Call this once after first successful request."""
    try:
        await db_instance.db.users.create_index("email", unique=True)
        await db_instance.db.videos.create_index(
            [("title", "text"), ("description", "text"), ("tags", "text")]
        )
        print("[OK] Indexes created")
    except Exception as e:
        print(f"[WARN] Index creation skipped: {e}")


async def close_db():
    if db_instance.client:
        db_instance.client.close()
        print("[DONE] Disconnected from MongoDB")


def get_db():
    return db_instance.db
