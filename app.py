from flask import Flask
from flask_cors import CORS
from routes.cayxanh import cayxanh_bp
from routes.login import login_bp
import mysql.connector
import os
from dotenv import load_dotenv

# Chỉ tải file .env từ thư mục hiện tại (Chỉ chạy khi DEV CỤC BỘ)
# Lệnh này sẽ bị Render BỎ QUA, vì Render tự cấp biến môi trường
load_dotenv()

# --- Kiểm tra: Đảm bảo sử dụng cùng prefix MYSQL_ ---
print("MYSQL_HOST:", os.getenv("MYSQL_HOST"))
print("MYSQL_USER:", os.getenv("MYSQL_USER"))
print("MYSQL_PASSWORD:", os.getenv("MYSQL_PASSWORD"))
print("MYSQL_DATABASE:", os.getenv("MYSQL_DATABASE"))
print("DB_PORT:", os.getenv("DB_PORT")) # Cần kiểm tra biến này vẫn là DB_PORT

# --- Khởi tạo Flask app ---
app = Flask(__name__)
CORS(app)
app.secret_key = 'secretkey123'

# --- Kết nối MySQL ---
# Lưu ý: Sẽ dùng giá trị từ .env khi local, và từ Render khi deploy
db = mysql.connector.connect(
    host=os.getenv('MYSQL_HOST'),
    user=os.getenv('MYSQL_USER'),
    password=os.getenv('MYSQL_PASSWORD'), 
    database=os.getenv('MYSQL_DATABASE'),
    port=int(os.getenv('DB_PORT', 3306))
)

print("Kết nối MySQL thành công!")

# ... (các phần còn lại của code) ...

# --- Đăng ký Blueprint ---
app.register_blueprint(cayxanh_bp)
app.register_blueprint(login_bp)

# --- Chạy ứng dụng ---
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5500)
