from flask import Blueprint, request

from database import get_db
from utils.helpers import admin_required, login_required, ok, err

review_bp = Blueprint("review", __name__)


def ensure_reviews_table(cur):
    cur.execute(
        """CREATE TABLE IF NOT EXISTS reviews (
            idReview INT AUTO_INCREMENT PRIMARY KEY,
            idOrder INT NOT NULL,
            idUser INT NOT NULL,
            rating INT NOT NULL,
            komentar TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            KEY idx_reviews_order (idOrder),
            KEY idx_reviews_user (idUser),
            CONSTRAINT fk_reviews_order FOREIGN KEY (idOrder) REFERENCES orders(idOrder) ON DELETE CASCADE,
            CONSTRAINT fk_reviews_user FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"""
    )


@review_bp.route("/reviews", methods=["POST"])
@login_required
def create_review():
    user_id = int(request.user["sub"])
    data = request.get_json() or {}
    order_id = data.get("idOrder")
    rating = int(data.get("rating") or 0)
    komentar = (data.get("komentar") or "").strip()

    if not order_id:
        return err("Pilih pesanan yang ingin direview")
    if rating < 1 or rating > 5:
        return err("Rating harus antara 1 sampai 5")
    if not komentar:
        return err("Review tidak boleh kosong")

    conn, cur = get_db()
    ensure_reviews_table(cur)
    cur.execute("SELECT * FROM orders WHERE idOrder=%s AND idUser=%s", (order_id, user_id))
    order = cur.fetchone()
    if not order:
        conn.close()
        return err("Pesanan tidak ditemukan", 404)

    cur.execute(
        "INSERT INTO reviews (idOrder, idUser, rating, komentar) VALUES (%s,%s,%s,%s)",
        (order_id, user_id, rating, komentar),
    )
    conn.commit()
    review_id = cur.lastrowid
    cur.execute("SELECT * FROM reviews WHERE idReview=%s", (review_id,))
    review = cur.fetchone()
    conn.close()
    return ok(review, "Review berhasil dikirim", 201)


@review_bp.route("/reviews", methods=["GET"])
@login_required
def get_reviews():
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    ensure_reviews_table(cur)
    cur.execute(
        """SELECT r.*, o.tanggal, o.total, o.status
           FROM reviews r
           JOIN orders o ON r.idOrder=o.idOrder
           WHERE r.idUser=%s
           ORDER BY r.createdAt DESC""",
        (user_id,),
    )
    reviews = cur.fetchall()
    conn.close()
    return ok({"reviews": reviews})


@review_bp.route("/admin/reviews", methods=["GET"])
@admin_required
def admin_get_reviews():
    conn, cur = get_db()
    ensure_reviews_table(cur)
    cur.execute(
        """SELECT r.*, u.nama, u.email, o.tanggal, o.total, o.status
           FROM reviews r
           JOIN users u ON r.idUser=u.idUser
           JOIN orders o ON r.idOrder=o.idOrder
           ORDER BY r.createdAt DESC"""
    )
    reviews = cur.fetchall()
    conn.close()
    return ok({"reviews": reviews})
