from flask import Blueprint, request

from database import get_db
from utils.helpers import create_token, hash_password, login_required, ok, err

account_bp = Blueprint("account", __name__)


def public_user(row):
    return {
        "idUser": row["idUser"],
        "nama": row["nama"],
        "email": row["email"],
        "noHP": row["noHP"],
        "alamat": row["alamat"],
        "role": row["role"],
    }


@account_bp.route("/account", methods=["GET"])
@login_required
def get_account():
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    cur.execute(
        "SELECT idUser, nama, email, noHP, alamat, role FROM users WHERE idUser=%s",
        (user_id,),
    )
    user = cur.fetchone()
    conn.close()
    if not user:
        return err("Akun tidak ditemukan", 404)
    return ok(public_user(user))


@account_bp.route("/account", methods=["PUT"])
@login_required
def update_account():
    user_id = int(request.user["sub"])
    data = request.get_json() or {}

    allowed = {
        "nama": data.get("nama"),
        "email": data.get("email"),
        "noHP": data.get("noHP"),
        "alamat": data.get("alamat"),
    }
    updates = []
    values = []

    for column, value in allowed.items():
        if value is not None:
            updates.append(f"{column}=%s")
            values.append(value.strip() if isinstance(value, str) else value)

    password = data.get("password")
    if password:
        updates.append("password=%s")
        values.append(hash_password(password))

    if not updates:
        return err("Tidak ada data akun yang diubah")

    conn, cur = get_db()

    email = allowed.get("email")
    if email:
        cur.execute("SELECT idUser FROM users WHERE email=%s AND idUser<>%s", (email, user_id))
        if cur.fetchone():
            conn.close()
            return err("Email sudah digunakan akun lain", 409)

    values.append(user_id)
    cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE idUser=%s", values)
    conn.commit()

    cur.execute(
        "SELECT idUser, nama, email, noHP, alamat, role FROM users WHERE idUser=%s",
        (user_id,),
    )
    user = cur.fetchone()
    conn.close()

    result = {"user": public_user(user)}
    if email:
        result["token"] = create_token(user["idUser"], user["email"], user["role"])

    return ok(result, "Akun berhasil diperbarui")
