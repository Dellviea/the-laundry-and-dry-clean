from flask import Blueprint, request, jsonify
from database import users

register_bp = Blueprint('register', __name__)

@register_bp.route("/register", methods=["POST"])
def register():
    data = request.json

    email = data.get("email")
    password = data.get("password")
    confirm_password = data.get("confirm_password")

    if not email or not password or not confirm_password:
        return jsonify({"message": "Semua field harus diisi"}), 400

    if password != confirm_password:
        return jsonify({"message": "Password tidak sama"}), 400

    for user in users:
        if user["email"] == email:
            return jsonify({"message": "Email sudah terdaftar"}), 400

    users.append({
        "email": email,
        "password": password
    })

    return jsonify({"message": "Register berhasil"})