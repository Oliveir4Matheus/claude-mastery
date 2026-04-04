from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from .database import Base
from .routes import router, limiter
from .config import CORS_ORIGIN, JWT_SECRET

if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET environment variable is required and must be set")

app = FastAPI(title="Claude Code Mastery API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in CORS_ORIGIN.split(",") if o.strip()] if CORS_ORIGIN else []

# Security: default to restrictive policy if CORS_ORIGIN not configured
if not origins:
    raise RuntimeError("CORS_ORIGIN environment variable must be configured for security in production")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
    max_age=3600,
)

app.include_router(router, prefix="/api")

# Security middleware: add security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
    return response


@app.get("/health")
async def health():
    return {"status": "ok"}
