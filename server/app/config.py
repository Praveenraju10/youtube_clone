from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    cloudinary_cloud_name: str
    cloudinary_api_key: str
    cloudinary_api_secret: str
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
