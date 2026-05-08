from flask import Blueprint, request
from database import get_db
from utils.helpers import hash_password, create_token, ok, err

register_bp = Blueprint("register", __name__)


@register_bp.route("/register", methods=["POST"])
def register():
    data             = request.get_json() or {}
    email            = data.get("email", "").strip()
    password         = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    nama             = data.get("nama", "").strip()
    noHP             = data.get("noHP", "").strip()
    alamat           = data.get("alamat", "").strip()

    if not email or not password or not confirm_password:
        return err("Email, password, dan konfirmasi password wajib diisi")

    if password != confirm_password:
        return err("Password tidak sama")

    if len(password) < 6:
        return err("Password minimal 6 karakter")

    conn, cur = get_db()
    cur.execute("SELECT idUser FROM users WHERE email = %s", (email,))
    if cur.fetchone():
        conn.close()
        return err("Email sudah terdaftar")

    cur.execute(
        "INSERT INTO users (nama, email, password, noHP, alamat, role) VALUES (%s,%s,%s,%s,%s,'customer')",
        (nama or email.split("@")[0], email, hash_password(password),
         noHP or None, alamat or None)
    )
    conn.commit()
    new_id = cur.lastrowid

    cur.execute("SELECT * FROM users WHERE idUser = %s", (new_id,))
    user = cur.fetchone()
    conn.close()

    user.pop("password", None)
    token = create_token(user["idUser"], user["email"], user["role"])
    return ok({"token": token, "user": user}, "Register berhasil", 201)
