from flask import Blueprint, request
from database import get_db
from utils.helpers import hash_password, ok, err

forgot_bp = Blueprint("forgot", __name__)


@forgot_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data  = request.get_json() or {}
    email = data.get("email", "").strip()

    if not email:
        return err("Email tidak boleh kosong")

    conn, cur = get_db()
    cur.execute("SELECT idUser FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    conn.close()

    if not user:
        return err("Email tidak ditemukan", 404)

    return ok(message="Link reset password dikirim ke email Anda")


@forgot_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data         = request.get_json() or {}
    email        = data.get("email", "").strip()
    new_password = data.get("new_password", "")

    if not email or not new_password:
        return err("Email dan password baru wajib diisi")

    if len(new_password) < 6:
        return err("Password minimal 6 karakter")

    conn, cur = get_db()
    cur.execute("SELECT idUser FROM users WHERE email = %s", (email,))
    user = cur.fetchone()
    if not user:
        conn.close()
        return err("Email tidak ditemukan", 404)

    cur.execute("UPDATE users SET password = %s WHERE email = %s",
                (hash_password(new_password), email))
    conn.commit()
    conn.close()
    return ok(message="Password berhasil diubah. Silakan login dengan password baru.")
