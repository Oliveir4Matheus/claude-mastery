from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base
from .routes import router
from .config import CORS_ORIGIN

app = FastAPI(title="Claude Code Mastery API", version="1.0.0")

origins = [o.strip() for o in CORS_ORIGIN.split(",") if o.strip()] if CORS_ORIGIN else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins or ["*"],
    allow_credentials=bool(origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "ok"}
