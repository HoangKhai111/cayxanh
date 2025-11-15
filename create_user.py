from flask_bcrypt import Bcrypt
from db import get_connection

bcrypt = Bcrypt()

def tao_user_moi(username, plain_password):
    hashed_pw = bcrypt.generate_password_hash(plain_password).decode('utf-8')
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_pw))
    conn.commit()
    conn.close()

tao_user_moi('admin1', 'admin1')
