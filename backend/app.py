from flask import Flask
from flask_cors import CORS

from auth.login.login import login_bp
from auth.login.forgot import forgot_bp
from auth.register.register import register_bp

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend jalan!"

app.register_blueprint(login_bp)
app.register_blueprint(forgot_bp)
app.register_blueprint(register_bp)

if __name__ == "__main__":
    print("SERVER STARTING...")
    app.run(debug=True)