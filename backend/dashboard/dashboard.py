from flask import Blueprint
from database import get_db
from utils.helpers import admin_required, ok

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/admin/dashboard", methods=["GET"])
@admin_required
def dashboard():
    conn, cur = get_db()

    cur.execute("SELECT COUNT(*) AS total FROM orders")
    total_orders = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM orders WHERE status='DIPESAN'")
    pending = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM orders WHERE status IN ('DIJEMPUT','DIANTAR','DICUCI','DIKIRIM')")
    processed = cur.fetchone()["total"]

    cur.execute("SELECT COUNT(*) AS total FROM orders WHERE status='SELESAI'")
    selesai = cur.fetchone()["total"]

    cur.execute("SELECT COALESCE(SUM(total),0) AS revenue FROM orders WHERE status='SELESAI'")
    revenue = cur.fetchone()["revenue"]

    cur.execute("SELECT COUNT(*) AS total FROM users WHERE role='customer'")
    total_users = cur.fetchone()["total"]

    cur.execute(
        """SELECT o.idOrder, o.tanggal, o.total, o.status, u.nama, u.email
           FROM orders o JOIN users u ON o.idUser=u.idUser
           ORDER BY o.tanggal DESC LIMIT 5"""
    )
    recent_orders = cur.fetchall()

    cur.execute(
        """SELECT s.namaService,
                  SUM(oi.quantity) AS total_qty,
                  COALESCE(SUM(oi.subtotal),0) AS revenue
           FROM orderitems oi JOIN services s ON oi.idService=s.idService
           GROUP BY oi.idService, s.namaService
           ORDER BY total_qty DESC LIMIT 5"""
    )
    top_services = cur.fetchall()

    conn.close()
    return ok({
        "total_orders":   total_orders,
        "pending_orders": pending,
        "processed_orders": processed,
        "selesai_orders": selesai,
        "revenue":        int(revenue),
        "total_users":    total_users,
        "recent_orders":  recent_orders,
        "top_services":   top_services,
    })
