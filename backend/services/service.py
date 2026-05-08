from flask import Blueprint, request
from database import get_db
from utils.helpers import admin_required, ok, err

service_bp = Blueprint("service", __name__)


@service_bp.route("/services", methods=["GET"])
def get_services():
    conn, cur = get_db()
    cur.execute("SELECT * FROM services ORDER BY kategori, namaService")
    data = cur.fetchall()
    conn.close()
    return ok(data)


@service_bp.route("/services/recommended", methods=["GET"])
def get_recommended():
    conn, cur = get_db()
    cur.execute("SELECT * FROM services WHERE isRecommended=1 ORDER BY namaService")
    data = cur.fetchall()
    conn.close()
    return ok(data)


@service_bp.route("/admin/services", methods=["POST"])
@admin_required
def create_service():
    data     = request.get_json() or {}
    nama     = data.get("namaService", "").strip()
    harga    = data.get("harga", 0)
    satuan   = data.get("satuan", "Kg")
    kategori = data.get("kategori", "Reguler")
    is_rec   = 1 if data.get("isRecommended") else 0

    if not nama or not harga:
        return err("Nama dan harga layanan wajib diisi")

    conn, cur = get_db()
    cur.execute(
        "INSERT INTO services (namaService, harga, satuan, kategori, isRecommended) VALUES (%s,%s,%s,%s,%s)",
        (nama, harga, satuan, kategori, is_rec)
    )
    conn.commit()
    new_id = cur.lastrowid
    cur.execute("SELECT * FROM services WHERE idService=%s", (new_id,))
    svc = cur.fetchone()
    conn.close()
    return ok(svc, "Layanan berhasil ditambahkan", 201)


@service_bp.route("/admin/services/<int:service_id>", methods=["PUT"])
@admin_required
def update_service(service_id):
    data = request.get_json() or {}
    conn, cur = get_db()
    cur.execute("SELECT * FROM services WHERE idService=%s", (service_id,))
    if not cur.fetchone():
        conn.close()
        return err("Layanan tidak ditemukan", 404)

    fields, vals = [], []
    for col in ("namaService", "harga", "satuan", "kategori", "isRecommended"):
        if col in data:
            fields.append(f"{col}=%s"); vals.append(data[col])

    if not fields:
        conn.close()
        return err("Tidak ada data yang diubah")

    vals.append(service_id)
    cur.execute(f"UPDATE services SET {', '.join(fields)} WHERE idService=%s", vals)
    conn.commit()
    cur.execute("SELECT * FROM services WHERE idService=%s", (service_id,))
    svc = cur.fetchone()
    conn.close()
    return ok(svc, "Layanan berhasil diperbarui")


@service_bp.route("/admin/services/<int:service_id>", methods=["DELETE"])
@admin_required
def delete_service(service_id):
    conn, cur = get_db()
    cur.execute("SELECT idItem FROM orderitems WHERE idService=%s LIMIT 1", (service_id,))
    if cur.fetchone():
        conn.close()
        return err("Layanan sedang dipakai dalam pesanan, tidak bisa dihapus", 400)
    cur.execute("DELETE FROM services WHERE idService=%s", (service_id,))
    conn.commit()
    conn.close()
    return ok(message="Layanan berhasil dihapus")
