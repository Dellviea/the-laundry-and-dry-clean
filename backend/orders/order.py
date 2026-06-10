from flask import Blueprint, request
from database import get_db
from utils.helpers import login_required, admin_required, ok, err
from utils.frontend_contract import ensure_frontend_services
from payments.schema import ensure_xendit_payment_columns
from payments.xendit_client import XenditError, create_qris_invoice

order_bp = Blueprint("order", __name__)

VALID_TRANSITIONS = {
    "DIPESAN":  ["DIJEMPUT", "DIANTAR", "DICUCI", "DIBATALKAN"],
    "DIJEMPUT": ["DICUCI"],
    "DIANTAR":  ["DICUCI"],
    "DICUCI":   ["SELESAI"],
}


def ensure_order_status_enum(cur):
    cur.execute("SHOW COLUMNS FROM orders LIKE 'status'")
    column = cur.fetchone()
    if column and "DIANTAR" not in column.get("Type", ""):
        cur.execute(
            """ALTER TABLE orders
               MODIFY status ENUM('DIPESAN','DIJEMPUT','DIANTAR','DICUCI','DIKIRIM','SELESAI','DIBATALKAN')
               DEFAULT 'DIPESAN'"""
        )


def ensure_order_photo_column(cur):
    cur.execute("SHOW COLUMNS FROM orders LIKE 'buktiFoto'")
    if not cur.fetchone():
        cur.execute("ALTER TABLE orders ADD COLUMN buktiFoto LONGTEXT NULL AFTER catatan")


# Buat Pesanan (Customer)

@order_bp.route("/orders", methods=["POST"])
@login_required
def create_order():
    user_id = int(request.user["sub"])
    data    = request.get_json() or {}

    items              = data.get("items", [])
    metode_pengambilan = data.get("metodePengambilan", "Self")
    metode_pembayaran  = data.get("metodePembayaran", "QRIS")
    biaya_pengambilan  = int(data.get("biayaPengambilan") or 0)
    bukti_foto         = data.get("buktiFoto") or None
    catatan            = data.get("catatan", "")
    id_kasir           = data.get("idKasir", 1)
    id_toko            = data.get("idToko", 1)

    if not items:
        return err("Item pesanan tidak boleh kosong")

    conn, cur = get_db()
    total     = 0
    item_rows = []
    invoice_items = []
    ensure_frontend_services(cur)
    ensure_xendit_payment_columns(cur)
    ensure_order_status_enum(cur)
    ensure_order_photo_column(cur)

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
        invoice_items.append({
            "name": svc["namaService"],
            "quantity": qty,
            "price": svc["harga"],
        })

    total += biaya_pengambilan
    if biaya_pengambilan:
        invoice_items.append({
            "name": "Pickup Service",
            "quantity": 1,
            "price": biaya_pengambilan,
        })

    cur.execute(
        """INSERT INTO orders
           (idUser, idKasir, idToko, tanggal, metodePengambilan, total, status, catatan, buktiFoto)
           VALUES (%s, %s, %s, CURDATE(), %s, %s, 'DIPESAN', %s, %s)""",
        (user_id, id_kasir, id_toko, metode_pengambilan, total, catatan, bukti_foto)
    )
    order_id = cur.lastrowid

    for (id_service, qty, subtotal) in item_rows:
        cur.execute(
            "INSERT INTO orderitems (idOrder, idService, quantity, subtotal) VALUES (%s,%s,%s,%s)",
            (order_id, id_service, qty, subtotal)
        )

    cur.execute(
        "INSERT INTO payments (idOrder, metode, status, tanggalBayar) VALUES (%s,%s,'PENDING',CURDATE())",
        (order_id, metode_pembayaran)
    )

    payment_id = cur.lastrowid

    if metode_pembayaran.upper() == "QRIS":
        cur.execute("SELECT * FROM orders WHERE idOrder = %s", (order_id,))
        order = cur.fetchone()
        cur.execute("SELECT idUser, nama, email, noHP FROM users WHERE idUser = %s", (user_id,))
        user = cur.fetchone()

        try:
            invoice = create_qris_invoice(order, user or {}, invoice_items)
        except XenditError as exc:
            conn.rollback()
            conn.close()
            return err(str(exc), 502)

        cur.execute(
            """UPDATE payments
               SET xendit_invoice_id=%s,
                   xendit_external_id=%s,
                   xendit_invoice_url=%s,
                   xendit_status=%s
               WHERE idPayment=%s""",
            (
                invoice.get("id"),
                invoice.get("external_id"),
                invoice.get("invoice_url"),
                invoice.get("status"),
                payment_id,
            ),
        )

    conn.commit()

    cur.execute("SELECT * FROM orders WHERE idOrder = %s", (order_id,))
    order = cur.fetchone()
    cur.execute("SELECT * FROM payments WHERE idPayment = %s", (payment_id,))
    payment = cur.fetchone()
    conn.close()
    order["payment"] = payment
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
    return ok({"orders": orders})


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
    sql    = "SELECT o.*, u.nama, u.email, u.noHP, u.alamat FROM orders o JOIN users u ON o.idUser=u.idUser WHERE 1=1"
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
    ensure_order_status_enum(cur)
    cur.execute("SELECT * FROM orders WHERE idOrder=%s", (order_id,))
    order = cur.fetchone()
    if not order:
        conn.close()
        return err("Pesanan tidak ditemukan", 404)

    allowed = VALID_TRANSITIONS.get(order["status"], [])
    if order["status"] == "DIPESAN":
        cur.execute("SELECT metode FROM payments WHERE idOrder=%s", (order_id,))
        payment = cur.fetchone() or {}
        payment_method = (payment.get("metode") or "").lower()

        if payment_method == "cash" or order.get("metodePengambilan") == "Self":
            allowed = ["DIANTAR", "DIBATALKAN"]
        elif order.get("metodePengambilan") == "Pickup":
            allowed = ["DIJEMPUT", "DIBATALKAN"]
        else:
            allowed = ["DIANTAR", "DIBATALKAN"]
    if new_status not in allowed:
        conn.close()
        return err(f"Status tidak bisa diubah dari '{order['status']}' ke '{new_status}'", 400)

    cur.execute("UPDATE orders SET status=%s WHERE idOrder=%s", (new_status, order_id))
    if new_status == "DIANTAR":
        cur.execute(
            "UPDATE payments SET status='PAID', tanggalBayar=CURDATE() WHERE idOrder=%s",
            (order_id,)
        )
    cur.execute(
        "INSERT INTO notifications (idUser, pesan, waktu) VALUES (%s, %s, NOW())",
        (order["idUser"], f"Pesanan #{order_id} diperbarui menjadi {new_status}")
    )
    conn.commit()
    conn.close()
    return ok({"idOrder": order_id, "status": new_status}, "Status pesanan diperbarui")
