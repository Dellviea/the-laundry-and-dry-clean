from flask import Blueprint, request, jsonify
from database import users

login_bp = Blueprint('login', __name__)

@login_bp.route("/login", methods=["POST"])
def login():
    data = request.json

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email dan password wajib diisi"}), 400

    for user in users:
        if user["email"] == email and user["password"] == password:
            return jsonify({"message": "Login berhasil"})

    return jsonify({"message": "Email atau password salah"}), 401