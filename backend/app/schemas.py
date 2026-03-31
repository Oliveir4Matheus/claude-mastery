from pydantic import BaseModel, EmailStr
from datetime import datetime, date


# ── Auth ──
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    current_page: int
    created_at: datetime

class AuthResponse(BaseModel):
    user: UserResponse
    token: str


# ── Progress ──
class ProgressUpdate(BaseModel):
    score: int
    passed: bool
    calibration_score: int | None = None
    question_results: list | None = None

class ProgressResponse(BaseModel):
    chapter_id: str
    score: int
    passed: bool
    attempts: int
    calibration_score: int | None
    last_attempt: datetime | None
    question_results: list | None


# ── Certificate ──
class CertificateCreate(BaseModel):
    code: str
    holder_name: str
    target_type: str = "chapter"
    target_id: str
    target_title: str
    score: int

class CertificateResponse(BaseModel):
    code: str
    holder_name: str
    target_type: str
    target_id: str
    target_title: str
    score: int
    issued_at: datetime

class ValidateResponse(BaseModel):
    valid: bool
    certificate: CertificateResponse | None = None


# ── SRS ──
class SRSInitRequest(BaseModel):
    question_count: int

class SRSReviewRequest(BaseModel):
    correct: bool

class SRSCardResponse(BaseModel):
    card_key: str
    chapter_id: str
    question_index: int
    box: int
    next_review: date
    last_review: date | None
    review_count: int
    correct_streak: int

class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    total_reviews: int
    last_review_date: date | None


# ── Challenge ──
class ChallengeToggle(BaseModel):
    completed: bool

class ChallengeResponse(BaseModel):
    challenge_id: str
    completed: bool
    completed_at: datetime | None


# ── Current Page ──
class PageUpdate(BaseModel):
    page: int


# ── Sync ──
class SyncResponse(BaseModel):
    current_page: int
    progress: list[ProgressResponse]
    certificates: list[CertificateResponse]
    srs_cards: list[SRSCardResponse]
    challenges: list[ChallengeResponse]
    streak: StreakResponse
