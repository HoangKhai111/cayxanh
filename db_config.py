import pymysql
from pymysql.cursors import DictCursor

def get_connection():
    return pymysql.connect(
        host='localhost',
        user='root',
        password='',
        database='cayxanh_db',
        charset='utf8mb4',
        # cursorclass=DictCursor,
        cursorclass=pymysql.cursors.DictCursor
    )