from flask import Blueprint, request
from database import get_db
from utils.helpers import check_password, create_token, ok, err

login_bp = Blueprint("login", __name__)


@login_bp.route("/login", methods=["POST"])
def login():
    data     = request.get_json() or {}
    email    = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return err("Email dan password wajib diisi")

    conn, cur = get_db()
    cur.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    conn.close()

    if not user:
        return err("Email atau password salah", 401)

    if not check_password(password, user["password"]):
        return err("Email atau password salah", 401)

    token = create_token(user["idUser"], user["email"], user["role"])
    user.pop("password", None)
    return ok({"token": token, "user": user}, "Login berhasil")
