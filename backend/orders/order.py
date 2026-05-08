from flask import Blueprint, request
from database import get_db
from utils.helpers import login_required, admin_required, ok, err

order_bp = Blueprint("order", __name__)

VALID_TRANSITIONS = {
    "DIPESAN":  ["DIJEMPUT", "DIBATALKAN"],
    "DIJEMPUT": ["DICUCI"],
    "DICUCI":   ["DIKIRIM"],
    "DIKIRIM":  ["SELESAI"],
}


# Buat Pesanan (Customer)

@order_bp.route("/orders", methods=["POST"])
@login_required
def create_order():
    user_id = int(request.user["sub"])
    data    = request.get_json() or {}

    items              = data.get("items", [])
    metode_pengambilan = data.get("metodePengambilan", "Self")
    catatan            = data.get("catatan", "")
    id_kasir           = data.get("idKasir", 1)
    id_toko            = data.get("idToko", 1)

    if not items:
        return err("Item pesanan tidak boleh kosong")

    conn, cur = get_db()
    total     = 0
    item_rows = []

    for item in items:
        cur.execute("SELECT * FROM services WHERE idService = %s", (item["idService"],))
        svc = cur.fetchone()
        if not svc:
            conn.close()
            return err(f"Layanan id {item['idService']} tidak ditemukan", 404)
        qty      = item.get("quantity", 1)
        subtotal = svc["harga"] * qty
        total   += subtotal
        item_rows.append((item["idService"], qty, subtotal))

    cur.execute(
        """INSERT INTO orders
           (idUser, idKasir, idToko, tanggal, metodePengambilan, total, status, catatan)
           VALUES (%s, %s, %s, CURDATE(), %s, %s, 'DIPESAN', %s)""",
        (user_id, id_kasir, id_toko, metode_pengambilan, total, catatan)
    )
    conn.commit()
    order_id = cur.lastrowid

    for (id_service, qty, subtotal) in item_rows:
        cur.execute(
            "INSERT INTO orderitems (idOrder, idService, quantity, subtotal) VALUES (%s,%s,%s,%s)",
            (order_id, id_service, qty, subtotal)
        )

    cur.execute(
        "INSERT INTO payments (idOrder, metode, status, tanggalBayar) VALUES (%s,'QRIS','PENDING',CURDATE())",
        (order_id,)
    )
    conn.commit()

    cur.execute("SELECT * FROM orders WHERE idOrder = %s", (order_id,))
    order = cur.fetchone()
    conn.close()
    return ok(order, "Pesanan berhasil dibuat", 201)


# Konfirmasi Pembayaran (Customer)

@order_bp.route("/orders/payment/confirm", methods=["POST"])
@login_required
def confirm_payment():
    user_id  = int(request.user["sub"])
    data     = request.get_json() or {}
    order_id = data.get("idOrder")
    metode   = data.get("metode", "QRIS")

    if not order_id:
        return err("idOrder wajib diisi")

    conn, cur = get_db()
    cur.execute("SELECT * FROM orders WHERE idOrder=%s AND idUser=%s", (order_id, user_id))
    if not cur.fetchone():
        conn.close()
        return err("Pesanan tidak ditemukan", 404)

    cur.execute(
        "UPDATE payments SET status='PAID', metode=%s, tanggalBayar=CURDATE() WHERE idOrder=%s",
        (metode, order_id)
    )
    conn.commit()
    conn.close()
    return ok(message=f"Pembayaran pesanan #{order_id} berhasil dikonfirmasi")


# Riwayat Pesanan (Customer) 

@order_bp.route("/orders/history", methods=["GET"])
@login_required
def order_history():
    user_id       = int(request.user["sub"])
    status_filter = request.args.get("status")

    conn, cur = get_db()
    if status_filter:
        cur.execute(
            "SELECT * FROM orders WHERE idUser=%s AND status=%s ORDER BY tanggal DESC",
            (user_id, status_filter)
        )
    else:
        cur.execute("SELECT * FROM orders WHERE idUser=%s ORDER BY tanggal DESC", (user_id,))

    orders = cur.fetchall()
    for o in orders:
        cur.execute(
            """SELECT oi.*, s.namaService, s.satuan
               FROM orderitems oi JOIN services s ON oi.idService=s.idService
               WHERE oi.idOrder=%s""", (o["idOrder"],)
        )
        o["items"] = cur.fetchall()
        cur.execute("SELECT * FROM payments WHERE idOrder=%s", (o["idOrder"],))
        o["payment"] = cur.fetchone()

    conn.close()
    return ok(orders)


# Detail Pesanan (Customer) 

@order_bp.route("/orders/<int:order_id>", methods=["GET"])
@login_required
def order_detail(order_id):
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    cur.execute("SELECT * FROM orders WHERE idOrder=%s AND idUser=%s", (order_id, user_id))
    order = cur.fetchone()
    if not order:
        conn.close()
        return err("Pesanan tidak ditemukan", 404)

    cur.execute(
        """SELECT oi.*, s.namaService, s.harga, s.satuan
           FROM orderitems oi JOIN services s ON oi.idService=s.idService
           WHERE oi.idOrder=%s""", (order_id,)
    )
    order["items"] = cur.fetchall()
    cur.execute("SELECT * FROM payments WHERE idOrder=%s", (order_id,))
    order["payment"] = cur.fetchone()
    conn.close()
    return ok(order)


# Batalkan Pesanan (Customer) 

@order_bp.route("/orders/<int:order_id>/cancel", methods=["POST"])
@login_required
def cancel_order(order_id):
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    cur.execute("SELECT * FROM orders WHERE idOrder=%s AND idUser=%s", (order_id, user_id))
    order = cur.fetchone()
    if not order:
        conn.close()
        return err("Pesanan tidak ditemukan", 404)
    if order["status"] != "DIPESAN":
        conn.close()
        return err("Hanya pesanan berstatus DIPESAN yang bisa dibatalkan", 400)

    cur.execute("UPDATE orders SET status='DIBATALKAN' WHERE idOrder=%s", (order_id,))
    conn.commit()
    conn.close()
    return ok(message=f"Pesanan #{order_id} berhasil dibatalkan")


# Semua Pesanan (Admin) 

@order_bp.route("/admin/orders", methods=["GET"])
@admin_required
def admin_get_orders():
    status_filter = request.args.get("status")
    search        = request.args.get("search", "")

    conn, cur = get_db()
    sql    = "SELECT o.*, u.nama, u.email, u.noHP FROM orders o JOIN users u ON o.idUser=u.idUser WHERE 1=1"
    params = []
    if status_filter:
        sql += " AND o.status=%s"; params.append(status_filter)
    if search:
        sql += " AND (u.nama LIKE %s OR u.email LIKE %s)"
        params += [f"%{search}%", f"%{search}%"]
    sql += " ORDER BY o.tanggal DESC"

    cur.execute(sql, params)
    orders = cur.fetchall()
    for o in orders:
        cur.execute(
            "SELECT oi.*, s.namaService, s.satuan FROM orderitems oi JOIN services s ON oi.idService=s.idService WHERE oi.idOrder=%s",
            (o["idOrder"],)
        )
        o["items"] = cur.fetchall()
        cur.execute("SELECT * FROM payments WHERE idOrder=%s", (o["idOrder"],))
        o["payment"] = cur.fetchone()

    conn.close()
    return ok(orders)


# Detail Pesanan (Admin)

@order_bp.route("/admin/orders/<int:order_id>", methods=["GET"])
@admin_required
def admin_order_detail(order_id):
    conn, cur = get_db()
    cur.execute(
        "SELECT o.*, u.nama, u.email, u.noHP, u.alamat FROM orders o JOIN users u ON o.idUser=u.idUser WHERE o.idOrder=%s",
        (order_id,)
    )
    order = cur.fetchone()
    if not order:
        conn.close()
        return err("Pesanan tidak ditemukan", 404)

    cur.execute(
        "SELECT oi.*, s.namaService, s.harga, s.satuan FROM orderitems oi JOIN services s ON oi.idService=s.idService WHERE oi.idOrder=%s",
        (order_id,)
    )
    order["items"] = cur.fetchall()
    cur.execute("SELECT * FROM payments WHERE idOrder=%s", (order_id,))
    order["payment"] = cur.fetchone()
    conn.close()
    return ok(order)


# Update Status (Admin) 

@order_bp.route("/admin/orders/<int:order_id>/status", methods=["PATCH"])
@admin_required
def admin_update_status(order_id):
    data       = request.get_json() or {}
    new_status = data.get("status", "")

    conn, cur = get_db()
    cur.execute("SELECT * FROM orders WHERE idOrder=%s", (order_id,))
    order = cur.fetchone()
    if not order:
        conn.close()
        return err("Pesanan tidak ditemukan", 404)

    allowed = VALID_TRANSITIONS.get(order["status"], [])
    if new_status not in allowed:
        conn.close()
        return err(f"Status tidak bisa diubah dari '{order['status']}' ke '{new_status}'", 400)

    cur.execute("UPDATE orders SET status=%s WHERE idOrder=%s", (new_status, order_id))
    cur.execute(
        "INSERT INTO notifications (idUser, pesan, waktu) VALUES (%s, %s, NOW())",
        (order["idUser"], f"Pesanan #{order_id} diperbarui menjadi {new_status}")
    )
    conn.commit()
    conn.close()
    return ok({"idOrder": order_id, "status": new_status}, "Status pesanan diperbarui")
