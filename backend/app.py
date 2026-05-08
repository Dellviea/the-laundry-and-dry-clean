from flask import Flask
from flask_cors import CORS

from auth.login.login        import login_bp
from auth.login.forgot       import forgot_bp
from auth.register.register  import register_bp
from orders.order            import order_bp
from payments.payment        import payment_bp
from services.service        import service_bp
from notifications.notification import notif_bp
from dashboard.dashboard     import dashboard_bp

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "Backend The Laundry & Dry Clean jalan! ✅"


app.register_blueprint(login_bp)
app.register_blueprint(forgot_bp)
app.register_blueprint(register_bp)
app.register_blueprint(order_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(service_bp)
app.register_blueprint(notif_bp)
app.register_blueprint(dashboard_bp)


if __name__ == "__main__":
    print("=" * 40)
    print("  The Laundry & Dry Clean – Backend")
    print("  http://127.0.0.1:5000")
    print("=" * 40)
    app.run(debug=True)
