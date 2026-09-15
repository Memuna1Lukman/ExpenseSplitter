from fastapi import HTTPException,Depends,status,APIRouter,Response
from .. import models,utils,schemas,oauth
from ..database import get_db
from ..config import settings
from sqlalchemy.orm import Session
from fastapi.security.oauth2 import OAuth2PasswordRequestForm
from ..config import settings
import urllib.parse
from fastapi.responses import RedirectResponse
import httpx
import secrets
router = APIRouter(
    tags= ["Authentication"],
    prefix="/auth"
)

@router.post("/login")
def login_user(
    response:Response,
    user:OAuth2PasswordRequestForm=Depends(),db:Session = Depends(get_db)):
    check_user = db.query(models.User).filter(models.User.email == user.username).first()
    if not check_user:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Invalid Credentials")

    verify_password = utils.unhash_password(user.password,check_user.password)
    if not verify_password:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,detail=f"Invalid Credentials")

    
    access_token = oauth.create_token(data={"owner_id": check_user.id})
    # reponse in the cookie form
    response.set_cookie(
        key="access_token",
        value = f"Bearer {access_token}",
        httponly= True,
        secure = False,
        samesite="lax",
        max_age=settings.access_token_expire_minutes*60
    )

    return {"message": "Login successful"}   



@router.post("/")
def logout_user (
    response:Response
):
    response.set_cookie(
        key="access_token",
        value = "",
        httponly= True,
        secure = False,
        samesite="lax",
        max_age=0
        )
    
    return {"message": "Logout successful"}


@router.get("/callback")
async def login_with_google(response:Response,code:str | None = None,error:str| None = None,db:Session = Depends(get_db)):
    if error :
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google auth error: {error}"
        )
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail= "Authorization code missing"
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        # A. Exchange authorization code for Google Access Token
        token_res = await client.post(
           "https://oauth2.googleapis.com/token",
           data={
               "client_id": settings.gemini_client_id,
                "client_secret":settings.gemini_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.redirect_uri,
           }
           
        )
        if token_res.status_code !=200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve token from Google"   
            )
        google_tokens = token_res.json()
        google_access_token = google_tokens.get("access_token")

        # B. Fetch Google user profile
        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {google_access_token}"},
        )         
        if token_res.status_code !=200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve token from Google"   
        )
        user_info = user_res.json()

        email = user_info.get("email")
        username = (
            user_info.get("name") or user_info.get("given_name") or email.split("@")[0]
        )
        # C. Check if user exists in DB, otherwise create a new record
        check_user = db.query(models.Users).filter(models.Users.email == email).first()
        if not check_user:
            # Generate a dummy password or random hash for OAuth users
            random_raw_password = secrets.token_urlsafe(32)
            random_password = utils.hash_password(random_raw_password)
            check_user = models.User(
                email=email, username=username, password=random_password
            )
            db.add(check_user)
            db.commit()
            db.refresh(check_user)

    # D. Issue backend JWT token
    access_token = oauth.create_token(data={"owner_id": check_user.id})

    # E. Set HttpOnly Cookie on response
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )

    return {
        "message": "Google Login successful",
        "user": {"id": check_user.id, "email": check_user.email},
    }


@router.get("/google/login")
def google_login():
    params = {
        "client_id":settings.gemini_client_id,
        "redirect_uri" : settings.redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    google_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=google_url)