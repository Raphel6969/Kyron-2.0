"""
Kyron 2.0 Enterprise OAuth Authentication Provider
Supports Google OAuth 2.0 and GitHub OAuth for Zero-Trust enterprise operator identity.
"""

from datetime import datetime, timezone, timedelta
import os
import secrets
import urllib.parse
from typing import Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Query, Request, Response, status
from fastapi.responses import RedirectResponse
import httpx
from jose import jwt, JWTError
from pydantic import BaseModel

router = APIRouter(prefix="/v1/auth", tags=["Authentication"])

SECRET_KEY = os.getenv("SECRET_KEY", "kyron-insecure-development-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_EXPIRE_DAYS = 7

# OAuth Client Configuration
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "").strip()
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "").strip()

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "").strip()
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "").strip()

# In-memory CSRF state cache (for active login handshakes)
_oauth_states: Dict[str, Dict[str, Any]] = {}


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(days=TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


class TokenExchangeRequest(BaseModel):
    provider: str
    code: str
    redirect_uri: Optional[str] = None


class VerifyTokenRequest(BaseModel):
    token: str


@router.get("/providers")
def get_auth_providers():
    """Return status of configured enterprise authentication providers."""
    return {
        "status": "operational",
        "providers": {
            "google": {
                "name": "Google Workspace",
                "enabled": bool(GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET),
                "client_id": GOOGLE_CLIENT_ID,
            },
            "github": {
                "name": "GitHub Enterprise",
                "enabled": bool(GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET),
                "client_id": GITHUB_CLIENT_ID,
            },
            "demo_roles": {
                "name": "Role Persona Switcher",
                "enabled": True,
            },
        },
    }


def _get_base_url(request: Request) -> str:
    """Determine the public base URL based on headers."""
    forwarded_host = request.headers.get("x-forwarded-host")
    forwarded_proto = request.headers.get("x-forwarded-proto", "http")
    if forwarded_host:
        return f"{forwarded_proto}://{forwarded_host}"
    return str(request.base_url).rstrip("/")


# ============================================================================
# Google OAuth 2.0 Handshake
# ============================================================================

@router.get("/google/login")
def google_login(
    request: Request,
    redirect_url: Optional[str] = Query(None, description="Frontend URL to redirect to after successful login"),
    callback_override: Optional[str] = Query(None, description="Explicit OAuth callback URL"),
):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth credentials are not configured in environment (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET).",
        )

    state = secrets.token_urlsafe(24)
    base_url = _get_base_url(request)
    callback_uri = callback_override or f"{base_url}/v1/auth/google/callback"

    _oauth_states[state] = {
        "provider": "google",
        "redirect_url": redirect_url or "/console",
        "callback_uri": callback_uri,
        "created_at": datetime.now(timezone.utc),
    }

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": callback_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "online",
        "prompt": "select_account",
    }
    google_auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=google_auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
):
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Google OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code from Google.")

    state_data = _oauth_states.pop(state, {}) if state else {}
    base_url = _get_base_url(request)
    callback_uri = state_data.get("callback_uri") or f"{base_url}/v1/auth/google/callback"
    frontend_target = state_data.get("redirect_url") or "/console"

    # Exchange authorization code for tokens
    async with httpx.AsyncClient(timeout=10.0) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": callback_uri,
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange Google OAuth code: {token_resp.text}",
            )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        # Fetch Google user profile
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve Google user profile.",
            )
        user_info = user_resp.json()

    user_email = user_info.get("email", "unknown@google.com")
    user_name = user_info.get("name", user_email.split("@")[0])
    avatar_url = user_info.get("picture", "")

    jwt_token = create_access_token({
        "sub": user_email,
        "name": user_name,
        "email": user_email,
        "picture": avatar_url,
        "provider": "google",
        "role": "sec-admin",
        "role_name": "Enterprise Security Lead",
    })

    # Redirect to frontend with token in query param
    separator = "&" if "?" in frontend_target else "?"
    redirect_target = (
        f"{frontend_target}{separator}"
        f"token={urllib.parse.quote(jwt_token)}&"
        f"user={urllib.parse.quote(user_name)}&"
        f"email={urllib.parse.quote(user_email)}&"
        f"provider=google"
    )
    return RedirectResponse(url=redirect_target, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


# ============================================================================
# GitHub OAuth Handshake
# ============================================================================

@router.get("/github/login")
def github_login(
    request: Request,
    redirect_url: Optional[str] = Query(None, description="Frontend URL to redirect to after successful login"),
    callback_override: Optional[str] = Query(None, description="Explicit OAuth callback URL"),
):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="GitHub OAuth credentials are not configured in environment (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET).",
        )

    state = secrets.token_urlsafe(24)
    base_url = _get_base_url(request)
    callback_uri = callback_override or f"{base_url}/v1/auth/github/callback"

    _oauth_states[state] = {
        "provider": "github",
        "redirect_url": redirect_url or "/console",
        "callback_uri": callback_uri,
        "created_at": datetime.now(timezone.utc),
    }

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": callback_uri,
        "scope": "read:user user:email",
        "state": state,
    }
    github_auth_url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=github_auth_url, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


@router.get("/github/callback")
async def github_callback(
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
):
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"GitHub OAuth error: {error}")
    if not code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing authorization code from GitHub.")

    state_data = _oauth_states.pop(state, {}) if state else {}
    base_url = _get_base_url(request)
    callback_uri = state_data.get("callback_uri") or f"{base_url}/v1/auth/github/callback"
    frontend_target = state_data.get("redirect_url") or "/console"

    # Exchange authorization code for token
    async with httpx.AsyncClient(timeout=10.0) as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": callback_uri,
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to exchange GitHub OAuth code: {token_resp.text}",
            )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            err_desc = token_data.get("error_description", token_data.get("error", "Unknown error"))
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"GitHub OAuth failed: {err_desc}")

        # Fetch GitHub user profile
        user_resp = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token}", "User-Agent": "Kyron-ZeroTrust-Gate/2.0"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve GitHub user profile.",
            )
        user_info = user_resp.json()

        # If email is private, query emails endpoint
        user_email = user_info.get("email")
        if not user_email:
            emails_resp = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "User-Agent": "Kyron-ZeroTrust-Gate/2.0"},
            )
            if emails_resp.status_code == 200:
                emails = emails_resp.json()
                for em in emails:
                    if em.get("primary") and em.get("verified"):
                        user_email = em.get("email")
                        break
        if not user_email:
            user_email = f"{user_info.get('login', 'user')}@github.user"

    user_name = user_info.get("name") or user_info.get("login") or "GitHub Operator"
    avatar_url = user_info.get("avatar_url", "")

    jwt_token = create_access_token({
        "sub": user_email,
        "name": user_name,
        "email": user_email,
        "picture": avatar_url,
        "provider": "github",
        "role": "sec-admin",
        "role_name": "Enterprise Security Lead",
    })

    separator = "&" if "?" in frontend_target else "?"
    redirect_target = (
        f"{frontend_target}{separator}"
        f"token={urllib.parse.quote(jwt_token)}&"
        f"user={urllib.parse.quote(user_name)}&"
        f"email={urllib.parse.quote(user_email)}&"
        f"provider=github"
    )
    return RedirectResponse(url=redirect_target, status_code=status.HTTP_307_TEMPORARY_REDIRECT)


# ============================================================================
# Session Verification & User Profile
# ============================================================================

@router.get("/me")
def get_current_user(request: Request):
    """Retrieve details of the currently authenticated operator."""
    auth_header = request.headers.get("authorization", "")
    token = None
    if auth_header.startswith("Bearer "):
        token = auth_header.split(" ", 1)[1].strip()

    if not token:
        # Check query param as fallback
        token = request.query_params.get("token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "authenticated": True,
        "user": {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "name": payload.get("name"),
            "picture": payload.get("picture"),
            "provider": payload.get("provider", "local"),
            "role": payload.get("role", "sec-admin"),
            "role_name": payload.get("role_name", "Enterprise Security Lead"),
        },
    }


@router.post("/verify")
def verify_token(req: VerifyTokenRequest):
    """Validate a JWT access token and return token claims."""
    payload = decode_token(req.token)
    if not payload:
        return {"valid": False, "error": "Signature verification failed or token expired"}
    return {"valid": True, "claims": payload}
