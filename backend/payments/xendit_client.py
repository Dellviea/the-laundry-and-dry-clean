import base64
import json
import os
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

XENDIT_API_BASE_URL = "https://api.xendit.co"


class XenditError(Exception):
    pass


def _secret_key():
    key = os.getenv("XENDIT_SECRET_KEY", "").strip()
    if not key:
        raise XenditError("XENDIT_SECRET_KEY belum diatur di .env")
    return key


def _request(method, path, payload=None):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    token = base64.b64encode(f"{_secret_key()}:".encode("utf-8")).decode("utf-8")
    request = Request(
        f"{XENDIT_API_BASE_URL}{path}",
        data=body,
        method=method,
        headers={
            "Authorization": f"Basic {token}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urlopen(request, timeout=20) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise XenditError(f"Xendit error {exc.code}: {detail}") from exc
    except URLError as exc:
        raise XenditError(f"Tidak bisa menghubungi Xendit: {exc.reason}") from exc


def _compact(value):
    if isinstance(value, dict):
        return {
            key: _compact(item)
            for key, item in value.items()
            if item is not None and item != ""
        }
    if isinstance(value, list):
        return [_compact(item) for item in value]
    return value


def _frontend_payment_url(order_id, status):
    base = os.getenv("FRONTEND_PAYMENT_URL", "http://127.0.0.1:5500/frontend/customer/payment.html")
    separator = "&" if "?" in base else "?"
    return f"{base}{separator}order_id={order_id}&status={status}"


def create_qris_invoice(order, user, items):
    order_id = order["idOrder"]
    external_id = f"laundry-order-{order_id}-{int(datetime.utcnow().timestamp())}"
    amount = int(order["total"])
    payload = {
        "external_id": external_id,
        "amount": amount,
        "description": f"Laundry & Dry Clean - Pesanan #{order_id}",
        "invoice_duration": 86400,
        "currency": "IDR",
        "payment_methods": ["QRIS"],
        "success_redirect_url": _frontend_payment_url(order_id, "success"),
        "failure_redirect_url": _frontend_payment_url(order_id, "failed"),
        "customer": {
            "given_names": user.get("nama") or user.get("email") or "Customer",
            "email": user.get("email"),
            "mobile_number": user.get("noHP"),
        },
        "items": [
            {
                "name": item["name"],
                "quantity": int(item["quantity"]),
                "price": int(item["price"]),
                "category": "Laundry",
            }
            for item in items
        ],
        "metadata": {
            "order_id": order_id,
            "app": "Laundry & Dry Clean",
        },
    }

    invoice = _request("POST", "/v2/invoices", _compact(payload))
    invoice["external_id"] = external_id
    return invoice


def get_invoice(invoice_id):
    return _request("GET", f"/v2/invoices/{invoice_id}")
