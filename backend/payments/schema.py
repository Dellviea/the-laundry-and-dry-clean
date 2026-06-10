XENDIT_PAYMENT_COLUMNS = {
    "xendit_invoice_id": "VARCHAR(100) NULL",
    "xendit_external_id": "VARCHAR(120) NULL",
    "xendit_invoice_url": "TEXT NULL",
    "xendit_status": "VARCHAR(30) NULL",
    "xendit_paid_at": "DATETIME NULL",
}


def ensure_xendit_payment_columns(cur):
    for column, definition in XENDIT_PAYMENT_COLUMNS.items():
        cur.execute("SHOW COLUMNS FROM payments LIKE %s", (column,))
        if not cur.fetchone():
            cur.execute(f"ALTER TABLE payments ADD COLUMN {column} {definition}")
