from flask import Blueprint, render_template, request, redirect, url_for, session
from flask_bcrypt import Bcrypt
from db import get_connection
from utils import login_required

login_bp = Blueprint('login_bp', __name__)
bcrypt = Bcrypt()

@login_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        conn.close()

        if user and bcrypt.check_password_hash(user['password'], password):
            session['username'] = username  # Lưu trạng thái đăng nhập
            return redirect(url_for('login_bp.trangchu'))  # Đúng route của blueprint
        else:
            return redirect(url_for('login_bp.login', error='Tên đăng nhập hoặc mật khẩu không đúng'))

    error = request.args.get('error')
    return render_template('login.html', error=error)

@login_bp.route('/trangchu')
@login_required
def trangchu():
    username = session.get('username')  # Lấy username từ session
    return render_template('trangchu.html', username = username)
@login_bp.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login_bp.login'))