import hashlib
import hmac
import os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = os.getenv("SECRET_KEY", "afyamec-kenya-secret-change-in-production-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours

def hash_pin(pin: str) -> str:
    """Hash PIN using SHA-256 with a salt"""
    salt = hashlib.sha256(b"afyamec-kenya-salt-2025").hexdigest()
    return hashlib.sha256(f"{salt}{pin}".encode()).hexdigest()

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    try:
        return hmac.compare_digest(hash_pin(plain_pin), hashed_pin)
    except:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None