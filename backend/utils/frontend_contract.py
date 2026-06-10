FRONTEND_SERVICES = (
    (1, "Cuci Regular", 5000, "kg", "Reguler", 1),
    (2, "Cuci Express", 8000, "kg", "Express", 1),
    (3, "Setrika", 3000, "kg", "Reguler", 1),
    (4, "Dry Clean Jas", 25000, "kg", "Dry Clean", 0),
    (5, "Dry Clean Gaun", 30000, "kg", "Dry Clean", 0),
)


def ensure_frontend_services(cur):
    for service in FRONTEND_SERVICES:
        cur.execute(
            """INSERT IGNORE INTO services
               (idService, namaService, harga, satuan, kategori, isRecommended)
               VALUES (%s,%s,%s,%s,%s,%s)""",
            service,
        )
