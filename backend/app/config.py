import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://mastery:mastery_secret@localhost:5435/claude_mastery")

JWT_SECRET = os.getenv("JWT_SECRET", "")

JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "")
