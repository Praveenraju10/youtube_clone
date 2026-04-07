import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import connect_db, close_db, create_indexes
from app.routes import auth, videos, users, comments
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    asyncio.create_task(create_indexes())  # non-blocking
    yield
    await close_db()


app = FastAPI(
    title="YouTube Clone API",
    description="Full-featured YouTube clone built with FastAPI",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(users.router)
app.include_router(comments.router)


@app.get("/")
async def root():
    return {"message": "YouTube Clone API 🚀", "docs": "/docs"}
