import os
import pymysql
import pymysql.cursors
from dotenv import load_dotenv

load_dotenv()

def get_db():
    conn = pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DB", "the_laundry_dry"),
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
    )
    return conn, conn.cursor()