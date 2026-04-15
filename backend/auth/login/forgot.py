from flask import Blueprint, request, jsonify
from database import users

forgot_bp = Blueprint('forgot', __name__)

@forgot_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.json

    email = data.get("email")

    if not email:
        return jsonify({"message": "Email tidak boleh kosong"}), 400

    for user in users:
        if user["email"] == email:
            return jsonify({"message": "Link reset password dikirim"})

    return jsonify({"message": "Email tidak ditemukan"}), 404