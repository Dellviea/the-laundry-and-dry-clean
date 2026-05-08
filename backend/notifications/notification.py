from flask import Blueprint, request
from database import get_db
from utils.helpers import login_required, ok

notif_bp = Blueprint("notif", __name__)


@notif_bp.route("/notifications", methods=["GET"])
@login_required
def get_notifications():
    user_id = int(request.user["sub"])
    conn, cur = get_db()
    cur.execute(
        "SELECT * FROM notifications WHERE idUser=%s ORDER BY waktu DESC",
        (user_id,)
    )
    data = cur.fetchall()
    conn.close()
    return ok(data)
