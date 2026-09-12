"""Real authentication: bcrypt-hashed passwords in SQLite, JWT sessions.

No mock login here -- signup writes an actual row, login checks an actual
hash, and every protected route rejects a missing or invalid token.
"""
from __future__ import annotations

import os
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Optional

import bcrypt
import jwt
from fastapi import HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

DB_PATH = Path(__file__).resolve().parent.parent / "leastpriv.db"
JWT_SECRET = os.environ.get("JWT_SECRET", "dev-only-secret-change-me")
JWT_ALG = "HS256"
JWT_EXPIRY_SECONDS = 7 * 24 * 3600


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = _connect()
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            workspace TEXT NOT NULL,
            created_at REAL NOT NULL
        )
        """
    )
    conn.commit()
    conn.close()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)
    workspace: str = Field(default="acme-platform", min_length=1, max_length=120)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    workspace: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def _create_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": time.time() + JWT_EXPIRY_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def _decode_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(401, "Invalid or expired session — please sign in again")
    return payload["sub"]


def _row_to_user(row: sqlite3.Row) -> UserOut:
    return UserOut(id=row["id"], email=row["email"], name=row["name"], workspace=row["workspace"])


def get_user_by_id(user_id: str) -> Optional[UserOut]:
    conn = _connect()
    row = conn.execute("SELECT id, email, name, workspace FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return _row_to_user(row) if row else None


def signup(req: SignupRequest) -> TokenResponse:
    conn = _connect()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (req.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(409, "An account with this email already exists")

    user_id = uuid.uuid4().hex
    conn.execute(
        "INSERT INTO users (id, email, password_hash, name, workspace, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (user_id, req.email, _hash_password(req.password), req.name, req.workspace, time.time()),
    )
    conn.commit()
    conn.close()

    return TokenResponse(
        access_token=_create_token(user_id),
        user=UserOut(id=user_id, email=req.email, name=req.name, workspace=req.workspace),
    )


def login(req: LoginRequest) -> TokenResponse:
    conn = _connect()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (req.email,)).fetchone()
    conn.close()

    if not row or not _verify_password(req.password, row["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    return TokenResponse(access_token=_create_token(row["id"]), user=_row_to_user(row))


def get_current_user(request: Request) -> UserOut:
    token: Optional[str] = None
    header = request.headers.get("Authorization")
    if header and header.startswith("Bearer "):
        token = header[len("Bearer "):]
    if not token:
        token = request.query_params.get("token")
    if not token:
        raise HTTPException(401, "Not authenticated")

    user = get_user_by_id(_decode_token(token))
    if not user:
        raise HTTPException(401, "Account no longer exists")
    return user
