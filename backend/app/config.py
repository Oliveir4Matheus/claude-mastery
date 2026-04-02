import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://mastery:mastery_secret@localhost:5435/claude_mastery")

JWT_SECRET = os.environ.get("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required and must be set")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "")
