import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from flask import request, jsonify
from functools import wraps
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret")


# ── Password ──────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(plain: str, hashed: str) -> bool:
    """Support password lama (plain text dari SQL dump) dan bcrypt baru."""
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return plain == hashed  # fallback plain text


# ── JWT ───────────────────────────────────────────────────────

def create_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])


# ── Decorators ────────────────────────────────────────────────

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"success": False, "message": "Token tidak ditemukan"}), 401
        try:
            request.user = decode_token(auth.split(" ", 1)[1])
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token kadaluarsa, silakan login ulang"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Token tidak valid"}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"success": False, "message": "Token tidak ditemukan"}), 401
        try:
            payload = decode_token(auth.split(" ", 1)[1])
            if payload.get("role") not in ("admin", "ADMIN"):
                return jsonify({"success": False, "message": "Akses ditolak: hanya admin"}), 403
            request.user = payload
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token kadaluarsa"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Token tidak valid"}), 401
        return f(*args, **kwargs)
    return decorated


# ── Response helpers ──────────────────────────────────────────

def ok(data=None, message="Berhasil", status=200):
    resp = {"success": True, "message": message}
    if data is not None:
        resp["data"] = data
    return jsonify(resp), status


def err(message="Terjadi kesalahan", status=400):
    return jsonify({"success": False, "message": message}), status
