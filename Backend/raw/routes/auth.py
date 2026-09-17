import urllib.parse
import secrets
import httpx
from fastapi import HTTPException, Depends, status, APIRouter, Response, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import models, utils, schemas, oauth
from ..database import get_db, redis_client
from ..config import settings

router = APIRouter(
    tags=["Authentication"],
    prefix="/auth"
)


@router.post("/login")
def login_user(
    response: Response,
    user: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    check_user = db.query(models.User).filter(models.User.email == user.username).first()
    if not check_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")

    verify_password = utils.unhash_password(user.password, check_user.password)
    if not verify_password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid Credentials")

    access_token = oauth.create_token(data={"owner_id": check_user.id})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60
    )

    return {"message": "Login successful"}


@router.post("/logout")
def logout_user(response: Response):
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=0
    )
    return {"message": "Logout successful"}


@router.get("/google/login")
def google_login():
    params = {
        "client_id": settings.gemini_client_id,
        "redirect_uri": settings.redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    google_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=google_url)


@router.get("/callback")
async def login_with_google(
    response: Response,
    code: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db)
):
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Google auth error: {error}")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Authorization code missing")

    async with httpx.AsyncClient(timeout=20.0) as client:
        # A. Exchange code for access token
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.gemini_client_id,
                "client_secret": settings.gemini_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.redirect_uri,
            }
        )
        if token_res.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to retrieve token from Google")
        
        google_tokens = token_res.json()
        google_access_token = google_tokens.get("access_token")

        # B. Fetch Google user profile
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to retrieve user profile from Google")
        
        user_info = user_res.json()
        email = user_info.get("email")
        username = user_info.get("name") or user_info.get("given_name") or email.split("@")[0]

        # C. Find or create user
        check_user = db.query(models.User).filter(models.User.email == email).first()
        if not check_user:
            random_raw_password = secrets.token_urlsafe(32)
            random_password = utils.hash_password(random_raw_password)
            check_user = models.User(email=email, username=username, password=random_password)
            db.add(check_user)
            db.commit()
            db.refresh(check_user)

    # D. Issue session cookie
    access_token = oauth.create_token(data={"owner_id": check_user.id})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )

    return {"message": "Google Login successful", "user": {"id": check_user.id, "email": check_user.email}}


# --- PASSWORD RESET FLOW ---

@router.post("/forgot-password")
def forgot_password(
    body: schemas.PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if user:
        reset_token = oauth.create_password_reset_token(email=user.email)
        reset_link = f"http://127.0.0.1:8000/auth/reset-password?token={reset_token}"
        # background_tasks.add_task(send_reset_email, user.email, reset_link)
        print(f"[DEV ONLY] Password reset link for {user.email}: {reset_link}")

    return {"message": "If that email exists in our system, a password reset link has been sent."}


@router.post("/reset-password")
def reset_password(
    body: schemas.PasswordResetSubmit,
    db: Session = Depends(get_db)
):
    invalid_token_exception = HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid or expired password reset token"
    )
    email = oauth.verify_password_reset_token(body.token, invalid_token_exception)
    
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise invalid_token_exception

    user.password = utils.get_password_hash(body.new_password)
    db.add(user)
    db.commit()

    return {"message": "Password updated successfully"}


# --- OTP VERIFICATION FLOW ---

@router.post("/send-otp")
async def send_otp(
    body: schemas.OTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user:
        return {"message": "If the account exists, an OTP has been sent."}

    plain_otp = utils.generate_otp()
    hashed_otp = utils.hash_otp(plain_otp)
    redis_key = f"otp:{body.email}"
    
    # Store with 5 minute expiration (TTL)
    await redis_client.setex(name=redis_key, time=300, value=hashed_otp)

    # background_tasks.add_task(send_email_otp, body.email, plain_otp)
    print(f"[DEV ONLY] Generated OTP for {body.email}: {plain_otp}")
    return {"message": "OTP has been sent to your email."}


@router.post("/verify-otp")
async def verify_otp(
    body: schemas.OTPVerify,
    db: Session = Depends(get_db)
):
    redis_key = f"otp:{body.email}"
    stored_hashed_otp = await redis_client.get(redis_key)
    
    if not stored_hashed_otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired or was never requested"
        )

    is_valid = utils.verify_otp_hash(body.otp, stored_hashed_otp)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )

    # Delete OTP to prevent replay attacks
    await redis_client.delete(redis_key)

    user = db.query(models.User).filter(models.User.email == body.email).first()
    if user:
        user.is_verified = True
        db.add(user)
        db.commit()

    return {"message": "Account successfully verified!"}