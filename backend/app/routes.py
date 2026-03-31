from datetime import datetime, date, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from .database import get_db
from .models import User, Progress, Certificate, SRSCard, Challenge, ReviewStreak
from .auth import get_current_user, hash_password, verify_password, create_token
from .schemas import (
    RegisterRequest, LoginRequest, AuthResponse, UserResponse,
    ProgressUpdate, ProgressResponse,
    CertificateCreate, CertificateResponse, ValidateResponse,
    SRSInitRequest, SRSReviewRequest, SRSCardResponse, StreakResponse,
    ChallengeToggle, ChallengeResponse,
    PageUpdate, SyncResponse,
)

router = APIRouter()
INTERVALS = {1: 1, 2: 3, 3: 7, 4: 14, 5: 30}


# ── Auth ──────────────────────────────────────────────
@router.post("/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if len(req.password) < 6:
        raise HTTPException(400, "Senha deve ter pelo menos 6 caracteres")
    existing = await db.execute(select(User).where(User.email == req.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Email ja cadastrado")
    user = User(name=req.name.strip(), email=req.email.lower(), password_hash=hash_password(req.password))
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return AuthResponse(user=UserResponse.model_validate(user, from_attributes=True), token=create_token(user.id))


@router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalar_one_or_none()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Credenciais invalidas")
    return AuthResponse(user=UserResponse.model_validate(user, from_attributes=True), token=create_token(user.id))


@router.get("/auth/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user, from_attributes=True)


# ── Current Page ──────────────────────────────────────
@router.put("/page")
async def save_page(req: PageUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user.current_page = req.page
    await db.commit()
    return {"ok": True}


# ── Progress ──────────────────────────────────────────
@router.get("/progress", response_model=list[ProgressResponse])
async def get_progress(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Progress).where(Progress.user_id == user.id))
    return [ProgressResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.put("/progress/{chapter_id}", response_model=ProgressResponse)
async def save_progress(chapter_id: str, req: ProgressUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Progress).where(Progress.user_id == user.id, Progress.chapter_id == chapter_id))
    row = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if row:
        row.score = max(row.score, req.score)
        row.passed = row.passed or req.passed
        row.attempts += 1
        row.calibration_score = req.calibration_score or row.calibration_score
        row.question_results = req.question_results or row.question_results
        row.last_attempt = now
    else:
        row = Progress(user_id=user.id, chapter_id=chapter_id, score=req.score, passed=req.passed,
                       attempts=1, calibration_score=req.calibration_score,
                       question_results=req.question_results, last_attempt=now)
        db.add(row)
    await db.commit()
    await db.refresh(row)
    return ProgressResponse.model_validate(row, from_attributes=True)


@router.delete("/progress/{chapter_id}")
async def reset_chapter(chapter_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Progress).where(Progress.user_id == user.id, Progress.chapter_id == chapter_id))
    await db.execute(delete(SRSCard).where(SRSCard.user_id == user.id, SRSCard.chapter_id == chapter_id))
    await db.commit()
    return {"ok": True}


# ── Certificates ──────────────────────────────────────
@router.post("/certificates", response_model=CertificateResponse)
async def create_certificate(req: CertificateCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Certificate).where(Certificate.code == req.code))
    if existing.scalar_one_or_none():
        raise HTTPException(409, "Certificado ja existe")
    cert = Certificate(code=req.code, user_id=user.id, holder_name=req.holder_name,
                       target_type=req.target_type, target_id=req.target_id,
                       target_title=req.target_title, score=req.score)
    db.add(cert)
    await db.commit()
    await db.refresh(cert)
    return CertificateResponse.model_validate(cert, from_attributes=True)


@router.get("/certificates", response_model=list[CertificateResponse])
async def list_certificates(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.user_id == user.id).order_by(Certificate.issued_at.desc()))
    return [CertificateResponse.model_validate(c, from_attributes=True) for c in result.scalars()]


@router.get("/validate/{code}", response_model=ValidateResponse)
async def validate_certificate(code: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Certificate).where(Certificate.code == code))
    cert = result.scalar_one_or_none()
    if not cert:
        return ValidateResponse(valid=False)
    return ValidateResponse(valid=True, certificate=CertificateResponse.model_validate(cert, from_attributes=True))


# ── SRS ───────────────────────────────────────────────
@router.get("/srs/due", response_model=list[SRSCardResponse])
async def get_due_cards(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(SRSCard).where(SRSCard.user_id == user.id, SRSCard.next_review <= date.today()).order_by(SRSCard.box)
    )
    return [SRSCardResponse.model_validate(c, from_attributes=True) for c in result.scalars()]


@router.get("/srs/cards", response_model=list[SRSCardResponse])
async def get_all_cards(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SRSCard).where(SRSCard.user_id == user.id))
    return [SRSCardResponse.model_validate(c, from_attributes=True) for c in result.scalars()]


@router.post("/srs/init/{chapter_id}")
async def init_srs(chapter_id: str, req: SRSInitRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    tomorrow = date.today() + timedelta(days=1)
    for i in range(req.question_count):
        key = f"{chapter_id}-q{i}"
        existing = await db.execute(select(SRSCard).where(SRSCard.user_id == user.id, SRSCard.card_key == key))
        if not existing.scalar_one_or_none():
            db.add(SRSCard(user_id=user.id, card_key=key, chapter_id=chapter_id,
                           question_index=i, box=1, next_review=tomorrow, last_review=date.today()))
    await db.commit()
    return {"ok": True}


@router.put("/srs/review/{card_key}")
async def review_card(card_key: str, req: SRSReviewRequest, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SRSCard).where(SRSCard.user_id == user.id, SRSCard.card_key == card_key))
    card = result.scalar_one_or_none()
    if not card:
        raise HTTPException(404, "Card nao encontrado")

    new_box = min(card.box + 1, 5) if req.correct else 1
    card.box = new_box
    card.next_review = date.today() + timedelta(days=INTERVALS[new_box])
    card.last_review = date.today()
    card.review_count += 1
    card.correct_streak = card.correct_streak + 1 if req.correct else 0

    # Update streak
    result = await db.execute(select(ReviewStreak).where(ReviewStreak.user_id == user.id))
    streak = result.scalar_one_or_none()
    today_d = date.today()
    if not streak:
        streak = ReviewStreak(user_id=user.id, current_streak=1, longest_streak=1, last_review_date=today_d, total_reviews=1)
        db.add(streak)
    else:
        if streak.last_review_date != today_d:
            if streak.last_review_date == today_d - timedelta(days=1):
                streak.current_streak += 1
            else:
                streak.current_streak = 1
            streak.last_review_date = today_d
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
        streak.total_reviews += 1

    await db.commit()
    return {"ok": True}


@router.get("/srs/streak", response_model=StreakResponse)
async def get_streak(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReviewStreak).where(ReviewStreak.user_id == user.id))
    s = result.scalar_one_or_none()
    if not s:
        return StreakResponse(current_streak=0, longest_streak=0, total_reviews=0, last_review_date=None)
    return StreakResponse.model_validate(s, from_attributes=True)


# ── Challenges ────────────────────────────────────────
@router.get("/challenges", response_model=list[ChallengeResponse])
async def get_challenges(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Challenge).where(Challenge.user_id == user.id))
    return [ChallengeResponse.model_validate(c, from_attributes=True) for c in result.scalars()]


@router.put("/challenges/{challenge_id}")
async def toggle_challenge(challenge_id: str, req: ChallengeToggle, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Challenge).where(Challenge.user_id == user.id, Challenge.challenge_id == challenge_id))
    ch = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if req.completed:
        if not ch:
            db.add(Challenge(user_id=user.id, challenge_id=challenge_id, completed=True, completed_at=now))
        else:
            ch.completed = True
            ch.completed_at = now
    else:
        if ch:
            await db.delete(ch)
    await db.commit()
    return {"ok": True}


# ── Full Sync ─────────────────────────────────────────
@router.get("/sync", response_model=SyncResponse)
async def sync(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    progress = await db.execute(select(Progress).where(Progress.user_id == user.id))
    certs = await db.execute(select(Certificate).where(Certificate.user_id == user.id).order_by(Certificate.issued_at.desc()))
    cards = await db.execute(select(SRSCard).where(SRSCard.user_id == user.id))
    challenges = await db.execute(select(Challenge).where(Challenge.user_id == user.id))
    streak_r = await db.execute(select(ReviewStreak).where(ReviewStreak.user_id == user.id))
    s = streak_r.scalar_one_or_none()

    return SyncResponse(
        current_page=user.current_page,
        progress=[ProgressResponse.model_validate(r, from_attributes=True) for r in progress.scalars()],
        certificates=[CertificateResponse.model_validate(c, from_attributes=True) for c in certs.scalars()],
        srs_cards=[SRSCardResponse.model_validate(c, from_attributes=True) for c in cards.scalars()],
        challenges=[ChallengeResponse.model_validate(c, from_attributes=True) for c in challenges.scalars()],
        streak=StreakResponse.model_validate(s, from_attributes=True) if s else StreakResponse(current_streak=0, longest_streak=0, total_reviews=0, last_review_date=None),
    )
