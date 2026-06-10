from flask import Blueprint, request

from database import get_db
from utils.helpers import admin_required, login_required, ok, err

chat_bp = Blueprint("chat", __name__)


def ensure_chat_table(cur):
    cur.execute(
        """CREATE TABLE IF NOT EXISTS chat_messages (
            idMessage INT AUTO_INCREMENT PRIMARY KEY,
            idUser INT NOT NULL,
            senderRole VARCHAR(20) NOT NULL,
            message TEXT NOT NULL,
            isRead TINYINT(1) NOT NULL DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            KEY idx_chat_user (idUser),
            CONSTRAINT fk_chat_user FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"""
    )


@chat_bp.route("/chat/messages", methods=["GET"])
@login_required
def get_chat_messages():
    user = request.user
    user_id = int(user["sub"])
    target_user = request.args.get("idUser")

    if user.get("role") in ("admin", "ADMIN") and target_user:
        user_id = int(target_user)

    conn, cur = get_db()
    ensure_chat_table(cur)
    cur.execute(
        """SELECT m.*, u.nama, u.email
           FROM chat_messages m
           JOIN users u ON m.idUser=u.idUser
           WHERE m.idUser=%s
           ORDER BY m.createdAt ASC""",
        (user_id,),
    )
    messages = cur.fetchall()
    conn.close()
    return ok({"messages": messages})


@chat_bp.route("/chat/messages", methods=["POST"])
@login_required
def send_chat_message():
    user = request.user
    current_user_id = int(user["sub"])
    role = "admin" if user.get("role") in ("admin", "ADMIN") else "customer"
    data = request.get_json() or {}
    message = (data.get("message") or "").strip()
    target_user = data.get("idUser")

    if not message:
        return err("Pesan tidak boleh kosong")

    user_id = int(target_user) if role == "admin" and target_user else current_user_id

    conn, cur = get_db()
    ensure_chat_table(cur)
    cur.execute("SELECT idUser FROM users WHERE idUser=%s", (user_id,))
    if not cur.fetchone():
        conn.close()
        return err("Customer tidak ditemukan", 404)

    cur.execute(
        "INSERT INTO chat_messages (idUser, senderRole, message) VALUES (%s,%s,%s)",
        (user_id, role, message),
    )
    conn.commit()
    message_id = cur.lastrowid
    cur.execute("SELECT * FROM chat_messages WHERE idMessage=%s", (message_id,))
    created = cur.fetchone()
    conn.close()
    return ok(created, "Pesan berhasil dikirim", 201)


@chat_bp.route("/admin/chat/customers", methods=["GET"])
@admin_required
def admin_chat_customers():
    conn, cur = get_db()
    ensure_chat_table(cur)
    cur.execute(
        """SELECT u.idUser, u.nama, u.email, MAX(m.createdAt) AS lastMessageAt,
                  SUM(CASE WHEN m.senderRole='customer' AND m.isRead=0 THEN 1 ELSE 0 END) AS unreadCount
           FROM users u
           JOIN chat_messages m ON u.idUser=m.idUser
           GROUP BY u.idUser, u.nama, u.email
           ORDER BY lastMessageAt DESC"""
    )
    customers = cur.fetchall()
    conn.close()
    return ok({"customers": customers})
