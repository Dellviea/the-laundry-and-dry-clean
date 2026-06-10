from flask import Blueprint, request
from database import get_db
from utils.helpers import login_required, admin_required, ok, err
from payments.schema import ensure_xendit_payment_columns
from payments.xendit_client import XenditError, get_invoice

payment_bp = Blueprint("payment", __name__)


@payment_bp.route("/payments/<int:order_id>", methods=["GET"])
@login_required
def get_payment(order_id):
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    cur.execute("SELECT idOrder FROM orders WHERE idOrder=%s AND idUser=%s", (order_id, user_id))
    if not cur.fetchone():
        conn.close()
        return err("Pesanan tidak ditemukan", 404)
    cur.execute("SELECT * FROM payments WHERE idOrder=%s", (order_id,))
    data = cur.fetchone()
    conn.close()
    if not data:
        return err("Data pembayaran tidak ditemukan", 404)
    return ok(data)


@payment_bp.route("/payments/xendit/status/<int:order_id>", methods=["GET"])
@login_required
def get_xendit_payment_status(order_id):
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    ensure_xendit_payment_columns(cur)
    cur.execute("SELECT idOrder FROM orders WHERE idOrder=%s AND idUser=%s", (order_id, user_id))
    if not cur.fetchone():
        conn.close()
        return err("Pesanan tidak ditemukan", 404)

    cur.execute("SELECT * FROM payments WHERE idOrder=%s", (order_id,))
    payment = cur.fetchone()

    if not payment:
        conn.close()
        return err("Data pembayaran tidak ditemukan", 404)

    invoice_id = payment.get("xendit_invoice_id")
    if invoice_id and payment.get("status") != "PAID":
        try:
            invoice = get_invoice(invoice_id)
            xendit_status = invoice.get("status")
            payment_status = "PAID" if xendit_status in ("PAID", "SETTLED") else payment.get("status")
            cur.execute(
                """UPDATE payments
                   SET status=%s,
                       xendit_status=%s,
                       xendit_paid_at=%s,
                       tanggalBayar=IF(%s='PAID', CURDATE(), tanggalBayar)
                   WHERE idPayment=%s""",
                (
                    payment_status,
                    xendit_status,
                    invoice.get("paid_at"),
                    payment_status,
                    payment["idPayment"],
                ),
            )
            conn.commit()
            cur.execute("SELECT * FROM payments WHERE idPayment=%s", (payment["idPayment"],))
            payment = cur.fetchone()
        except XenditError:
            pass

    conn.close()
    return ok(payment)


@payment_bp.route("/admin/payments", methods=["GET"])
@admin_required
def admin_get_payments():
    status_filter = request.args.get("status")
    conn, cur = get_db()
    sql = """SELECT p.*, o.total, o.tanggal, u.nama, u.email
             FROM payments p
             JOIN orders o ON p.idOrder=o.idOrder
             JOIN users u ON o.idUser=u.idUser"""
    params = []
    if status_filter:
        sql += " WHERE p.status=%s"; params.append(status_filter)
    sql += " ORDER BY p.tanggalBayar DESC"
    cur.execute(sql, params)
    data = cur.fetchall()
    conn.close()
    return ok(data)


@payment_bp.route("/admin/payments/<int:payment_id>/verify", methods=["PATCH"])
@admin_required
def verify_payment(payment_id):
    conn, cur = get_db()
    cur.execute("SELECT * FROM payments WHERE idPayment=%s", (payment_id,))
    pay = cur.fetchone()
    if not pay:
        conn.close()
        return err("Pembayaran tidak ditemukan", 404)

    cur.execute(
        "UPDATE payments SET status='PAID', tanggalBayar=CURDATE() WHERE idPayment=%s",
        (payment_id,)
    )
    cur.execute("SELECT idUser FROM orders WHERE idOrder=%s", (pay["idOrder"],))
    order = cur.fetchone()
    if order:
        cur.execute(
            "INSERT INTO notifications (idUser, pesan, waktu) VALUES (%s,%s,NOW())",
            (order["idUser"], f"Pembayaran pesanan #{pay['idOrder']} telah diverifikasi")
        )
    conn.commit()
    conn.close()
    return ok(message="Pembayaran berhasil diverifikasi")
