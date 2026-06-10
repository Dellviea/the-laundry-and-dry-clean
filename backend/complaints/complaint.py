from flask import Blueprint, request

from database import get_db
from utils.helpers import admin_required, login_required, ok, err

complaint_bp = Blueprint("complaint", __name__)

VALID_COMPLAINT_STATUS = ("OPEN", "DIPROSES", "SELESAI")


def ensure_complaints_table(cur):
    cur.execute(
        """CREATE TABLE IF NOT EXISTS complaints (
            idComplaint INT AUTO_INCREMENT PRIMARY KEY,
            idOrder INT NULL,
            idUser INT NOT NULL,
            jenisKeluhan VARCHAR(100) NOT NULL,
            keluhan TEXT NOT NULL,
            buktiFoto LONGTEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
            adminResponse TEXT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            KEY idx_complaints_order (idOrder),
            KEY idx_complaints_user (idUser),
            CONSTRAINT fk_complaints_order FOREIGN KEY (idOrder) REFERENCES orders(idOrder) ON DELETE SET NULL,
            CONSTRAINT fk_complaints_user FOREIGN KEY (idUser) REFERENCES users(idUser) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci"""
    )
    cur.execute("SHOW COLUMNS FROM complaints LIKE 'buktiFoto'")
    if not cur.fetchone():
        cur.execute("ALTER TABLE complaints ADD COLUMN buktiFoto LONGTEXT NULL AFTER keluhan")


@complaint_bp.route("/complaints", methods=["POST"])
@login_required
def create_complaint():
    user_id = int(request.user["sub"])
    data = request.get_json() or {}
    order_id = data.get("idOrder") or None
    jenis_keluhan = (data.get("jenisKeluhan") or "").strip()
    keluhan = (data.get("keluhan") or "").strip()
    bukti_foto = data.get("buktiFoto") or None

    if not jenis_keluhan:
        return err("Jenis keluhan wajib dipilih")
    if not keluhan:
        return err("Detail keluhan wajib diisi")

    conn, cur = get_db()
    ensure_complaints_table(cur)

    if order_id:
        cur.execute("SELECT idOrder FROM orders WHERE idOrder=%s AND idUser=%s", (order_id, user_id))
        if not cur.fetchone():
            conn.close()
            return err("Pesanan tidak ditemukan", 404)

    cur.execute(
        """INSERT INTO complaints (idOrder, idUser, jenisKeluhan, keluhan, buktiFoto)
           VALUES (%s,%s,%s,%s,%s)""",
        (order_id, user_id, jenis_keluhan, keluhan, bukti_foto),
    )
    conn.commit()
    complaint_id = cur.lastrowid
    cur.execute("SELECT * FROM complaints WHERE idComplaint=%s", (complaint_id,))
    complaint = cur.fetchone()
    conn.close()
    return ok(complaint, "Complaint berhasil dikirim", 201)


@complaint_bp.route("/complaints", methods=["GET"])
@login_required
def get_complaints():
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    ensure_complaints_table(cur)
    cur.execute(
        """SELECT c.*, o.tanggal, o.total
           FROM complaints c
           LEFT JOIN orders o ON c.idOrder=o.idOrder
           WHERE c.idUser=%s
           ORDER BY c.createdAt DESC""",
        (user_id,),
    )
    complaints = cur.fetchall()
    conn.close()
    return ok({"complaints": complaints})


@complaint_bp.route("/admin/complaints", methods=["GET"])
@admin_required
def admin_get_complaints():
    status = request.args.get("status")
    conn, cur = get_db()
    ensure_complaints_table(cur)
    sql = """SELECT c.*, u.nama, u.email, o.tanggal, o.total, o.status AS orderStatus
             FROM complaints c
             JOIN users u ON c.idUser=u.idUser
             LEFT JOIN orders o ON c.idOrder=o.idOrder"""
    params = []
    if status:
        sql += " WHERE c.status=%s"
        params.append(status)
    sql += " ORDER BY c.createdAt DESC"
    cur.execute(sql, params)
    complaints = cur.fetchall()
    conn.close()
    return ok({"complaints": complaints})


@complaint_bp.route("/admin/complaints/<int:complaint_id>", methods=["PATCH"])
@admin_required
def admin_update_complaint(complaint_id):
    data = request.get_json() or {}
    status = (data.get("status") or "").upper()
    response = data.get("adminResponse")

    updates = []
    values = []
    if status:
        if status not in VALID_COMPLAINT_STATUS:
            return err("Status complaint tidak valid")
        updates.append("status=%s")
        values.append(status)
    if response is not None:
        updates.append("adminResponse=%s")
        values.append(response)

    if not updates:
        return err("Tidak ada data complaint yang diubah")

    conn, cur = get_db()
    ensure_complaints_table(cur)
    values.append(complaint_id)
    cur.execute(f"UPDATE complaints SET {', '.join(updates)} WHERE idComplaint=%s", values)
    if cur.rowcount == 0:
        conn.close()
        return err("Complaint tidak ditemukan", 404)
    conn.commit()
    cur.execute("SELECT * FROM complaints WHERE idComplaint=%s", (complaint_id,))
    complaint = cur.fetchone()
    conn.close()
    return ok(complaint, "Complaint berhasil diperbarui")
