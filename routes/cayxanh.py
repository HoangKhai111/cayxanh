from flask import Flask, Blueprint, request, jsonify, render_template
from werkzeug.utils import secure_filename
from db_config import get_connection
from upload_excel import import_excel  # Module xử lý Excel
import os
import traceback
import requests
from flask import request, jsonify
from shapely.geometry import Point, Polygon
from flask import session, redirect, url_for
from functools import wraps

# from pymysql.cursors import DictCursor
# Khởi tạo Flask app
app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
# Khởi tạo Blueprint
cayxanh_bp = Blueprint('cayxanh', __name__)
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login_bp.login'))
        return f(*args, **kwargs)
    return decorated_function

@cayxanh_bp.route('/themdulieu')
@login_required
def themdulieu_view():
    return render_template('themdulieu.html')
@cayxanh_bp.route('/themtuexcel')
@login_required
def themtuexcel_view():
    return render_template('themtuexcel.html')
@cayxanh_bp.route('/suadulieu')
@login_required
def suadulieu_view():
    return render_template('suadulieu.html')
@cayxanh_bp.route('/xoadulieu')
@login_required
def xoadulieu_view():
    return render_template('xoadulieu.html')
@cayxanh_bp.route('/locdulieu')
@login_required
def locdulieu_view():
    return render_template('locdulieu.html')

@cayxanh_bp.route('/duhiemhoa')
@login_required
def duhiemhoa_view():
    return render_template('duhiemhoa.html')

@cayxanh_bp.route('/dulieuquanly')
@login_required
def dulieuquanly_view():
    return render_template('dulieuquanly.html')
#--------------------------------
# xử lý dữ liệu
from datetime import datetime, date
from decimal import Decimal

def sanitize_row(row):
    cleaned = {}
    for key, value in row.items():
        if isinstance(value, bytes):
            try:
                cleaned[key] = value.decode('utf-8')
            except UnicodeDecodeError:
                cleaned[key] = value.hex()
        elif isinstance(value, (datetime, date)):
            cleaned[key] = value.isoformat()
        elif isinstance(value, Decimal):
            cleaned[key] = float(value)
        else:
            cleaned[key] = value
    return cleaned


# -------------------------------
# 1. Trang chính
# -------------------------------
@cayxanh_bp.route('/')
def index():
    return render_template('trangchu.html')

# -------------------------------
# 2. Thêm cây xanh mới
# -------------------------------
@cayxanh_bp.route('/api/cayxanh/them', methods=['POST'])
def them_cayxanh():
    try:
        data = request.get_json()

        # Kiểm tra các trường bắt buộc
        required_fields = ['toadox', 'toadoy', 'loai']
        if not all(data.get(field) for field in required_fields):
            return jsonify({'error': 'Thiếu dữ liệu bắt buộc (Tọa độ x, Tọa độ y, Loại)'}), 400

        # Kiểm tra kiểu dữ liệu tọa độ
        try:
            toadox = float(data['toadox'])
            toadoy = float(data['toadoy'])
            loai = int(data['loai'])
        except ValueError:
            return jsonify({'error': 'Tọa độ X, Tọa độ Y và Mã sức khỏe phải là số'}), 400
        if loai not in [1,2,3]:
            return jsonify({'error': 'Giá trị mã sức khỏe không hợp lệ'})

        geom = f"POINT({toadox} {toadoy})"

        with get_connection() as conn:
            with conn.cursor() as cursor:
                sql = """
                    INSERT INTO cayxanh (
                        diachi, toadox, toadoy, masocay, loaicay, duongkinh, chieucao, hientrang,
                        maphanloai, caytrongco, matuyencay, anhminhhoa, kehoachduy, lichsucayb,
                        madonviqua, manhathau, mahopdongq, mahientran, vitri, maloaicay, stt,
                        geom, loai
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326), %s
                    )
                """
                # Danh sách giá trị truyền vào
                values = (
                    data.get('diachi'), toadox, toadoy, data.get('masocay'), data.get('loaicay'),
                    data.get('duongkinh'), data.get('chieucao'), data.get('hientrang'), data.get('maphanloai'),
                    data.get('caytrongco'), data.get('matuyencay'), data.get('anhminhhoa'), data.get('kehoachduy'),
                    data.get('lichsucayb'), data.get('madonviqua'), data.get('manhathau'), data.get('mahopdongq'),
                    data.get('mahientran'), data.get('vitri'), data.get('maloaicay'), data.get('stt'),
                    geom, data.get('loai')
                )

                cursor.execute(sql, values)
                conn.commit()

                fid_moi = cursor.lastrowid

        return jsonify({'message': 'Thêm cây thành công', 'FID': fid_moi}), 201

    except Exception as e:
        print(" Lỗi thêm cây:", str(e))
        traceback.print_exc()
        return jsonify({'error': 'Đã xảy ra lỗi khi thêm cây. Vui lòng thử lại.'}), 500

# -------------------------------
# 3. Tìm kiếm cây theo FID
# -------------------------------
@cayxanh_bp.route('/api/cayxanh/timkiem_stt', methods=['GET'])
def tim_kiem_theo_fid():
    FID = request.args.get('FID')
    if not FID:
        return jsonify({"error": "Thiếu tham số FID"}), 400

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            sql = """
                SELECT stt, toadox, toadoy, loaicay, hientrang, FID, phutrach, ngaykiemtra, noidungphtrach
                FROM cayxanh
                WHERE FID = %s
            """
            cursor.execute(sql, (FID,))
            row = cursor.fetchone()

        if not row:
            return jsonify({"message": "Không tìm thấy cây với FID này"}), 404

        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [float(row['toadox']), float(row['toadoy'])]
            },
            "properties": {
                "FID": row['FID'],
                "toadox": row['toadox'],
                "toadoy": row['toadoy'],
                "loaicay": row['loaicay'],
                "hientrang":row['hientrang']
            }
        }

        return jsonify(feature)

    except Exception as e:
        print("Lỗi tìm kiếm:", str(e))
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# -------------------------------
# 4. Thêm dữ liệu từ Excel
# -------------------------------
@cayxanh_bp.route('/api/cayxanh/themtuexcel', methods=['POST'])
def them_tu_excel():
    if 'file' not in request.files:
        return jsonify({'error': 'Không có file Excel'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Chưa chọn file'}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        import_excel(filepath)
        return f'Tệp {filename} đã được xử lý và thêm thành công vào hệ thống', 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


#5------------
# Xóa dữ liệu
@cayxanh_bp.route('/api/cayxanh/xoa', methods=['DELETE'])
def xoa_nhieu_cayxanh():
    fid_list_str = request.args.get('fid')  # ví dụ: "1,2,3"

    if not fid_list_str:
        return jsonify({"error": "Thiếu tham số FID"}), 400

    try:
        # Tách chuỗi thành danh sách số nguyên
        fid_list = [int(fid.strip()) for fid in fid_list_str.split(',') if fid.strip().isdigit()]
        if not fid_list:
            return jsonify({"error": "Danh sách FID không hợp lệ"}), 400

        placeholders = ','.join(['%s'] * len(fid_list))
        query = f"DELETE FROM cayxanh WHERE fid IN ({placeholders})"

        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(query, fid_list)
            conn.commit()

        return jsonify(f"Đã xóa {cursor.rowcount} dữ liệu cây xanh"), 200

    except Exception as e:
        print("Lỗi khi xóa:", e)
        return jsonify({"error": str(e)}), 500
#6--------------- check lại
# Gọi dữ liệu
@cayxanh_bp.route('/api/cayxanh/thongtin', methods=['GET'])
def thong_tin_cay():
    fid = request.args.get('fid')
    if not fid:
        return jsonify({'error': 'Thiếu FID'}), 400

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM cayxanh WHERE fid = %s", (fid,))
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': 'Không tìm thấy cây'}), 404

            # Chuyển bytes thành chuỗi nếu có
            row_dict = dict(zip([desc[0] for desc in cursor.description], row))
            for key, value in row_dict.items():
                if isinstance(value, bytes):
                    row_dict[key] = value.decode('utf-8', errors='ignore')

            return jsonify(row_dict)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Sửa dữ liệu
@cayxanh_bp.route('/api/cayxanh/sua', methods=['PUT'])
def sua_cayxanh():
    try:
        data = request.get_json()
        fid = data.get('fid')

        if not fid:
            return jsonify({'error': 'Thiếu FID để cập nhật'}), 400

        conn = get_connection()
        with conn.cursor() as cursor:
            # Lấy dữ liệu hiện tại
            cursor.execute("SELECT * FROM cayxanh WHERE fid = %s", (fid,))
            row = cursor.fetchone()
            if not row:
                return jsonify({'error': f'Không tìm thấy cây có FID {fid}'}), 404

            # Danh sách các trường có thể cập nhật
            fields = [
                'toadox', 'toadoy', 'diachi', 'masocay', 'loaicay', 'duongkinh', 'chieucao',
                'hientrang', 'maphanloai', 'mahientran', 'maloaicay', 'vitri', 'stt',
                'matuyencay', 'anhminhhoa', 'lichsucayb', 'manhathau', 'mahopdongq', 'loai'
            ]

            # Dùng dữ liệu mới nếu có, nếu không thì giữ nguyên dữ liệu cũ
            updated = {}
            for field in fields:
                new_value = data.get(field)
                updated[field] = new_value if new_value is not None and new_value != '' else row[field]

            # Tạo lại trường geom từ toadox và toadoy mới (hoặc cũ nếu không thay đổi)
            geom = f"POINT({updated['toadox']} {updated['toadoy']})"

            # Câu lệnh cập nhật
            sql = """
                UPDATE cayxanh SET
                    toadox = %s, toadoy = %s, diachi = %s, masocay = %s, loaicay = %s,
                    duongkinh = %s, chieucao = %s, hientrang = %s,
                    maphanloai = %s, mahientran = %s, maloaicay = %s, vitri = %s,
                    stt = %s, matuyencay = %s, anhminhhoa = %s, lichsucayb = %s,
                    manhathau = %s, mahopdongq = %s,
                    geom = ST_PointFromText(%s, 4326), loai = %s
                WHERE fid = %s
            """

            cursor.execute(sql, (
                updated['toadox'], updated['toadoy'], updated['diachi'], updated['masocay'], updated['loaicay'],
                updated['duongkinh'], updated['chieucao'], updated['hientrang'],
                updated['maphanloai'], updated['mahientran'], updated['maloaicay'], updated['vitri'],
                updated['stt'], updated['matuyencay'], updated['anhminhhoa'], updated['lichsucayb'],
                updated['manhathau'], updated['mahopdongq'], geom,updated['loai'], fid
            ))
            conn.commit()

            return f'Đã cập nhật cây có FID {fid}', 200


    except Exception as e:
        print("Lỗi cập nhật cây:", e)
        return jsonify({'error': str(e)}), 500

# -------------------------------
#Lọc dữ liệu
import pymysql.cursors 

def convert_bytes_to_str(obj):
    if isinstance(obj, bytes):
        try:
            return obj.decode('utf-8')
        except UnicodeDecodeError:
            print(" Cảnh báo: Không decode được bytes bằng UTF-8:", obj)
            return obj.decode('utf-8', errors='replace') 
    return obj

@cayxanh_bp.route('/api/cayxanh/timkiem', methods=['GET'])
def tim_kiem_cay():
    fid = request.args.get('fid')
    loai = request.args.get('loai')
    hientrang = request.args.get('hientrang')
    loaicay = request.args.get('loaicay')
    phutrach = request.args.get('phutrach')
    noidungphtrach = request.args.get('noidungphtrach')
    ngaykiemtra = request.args.get('ngaykiemtra')
    diachi = request.args.get('diachi')
    matuyencay = request.args.get('matuyencay')
    duongkinh = request.args.get('duongkinh')
    chieucao = request.args.get('chieucao')
    maphanloai = request.args.get('maphanloai')
    anhminhhoa = request.args.get('anhminhhoa')
    madonviqua = request.args.get('madonviqua')
    manhathau = request.args.get('manhathau')
    mahopdongq = request.args.get('mahopdongq')
    mavitri = request.args.get('mavitri')
    maloaicay = request.args.get('maloaicay')
    
    sql = "SELECT * FROM cayxanh WHERE 1=1"
    params = []

    if fid:
        sql += " AND FID = %s"
        params.append(fid)
    if loai:
        sql += " AND loai = %s"
        params.append(loai)
    if hientrang:
        sql += " AND hientrang = %s"
        params.append(hientrang)
    if loaicay:
        sql += " AND loaicay LIKE %s"
        params.append(f"%{loaicay}%")
    if phutrach:
        sql += " AND phutrach LIKE %s"
        params.append(f"%{phutrach}%")
    if noidungphtrach:
        sql += " AND noidungphtrach LIKE %s"
        params.append(f"%{noidungphtrach}%")
    if ngaykiemtra:
        sql += " AND ngaykiemtra = %s"
        params.append(ngaykiemtra)
    if diachi:
        sql += " AND diachi LIKE %s"
        params.append(f"%{diachi}")
    if matuyencay:
        sql += " AND matuyencay LIKE %s"
        params.append(f"%{matuyencay}")    
    if duongkinh:
        sql += " AND duongkinh = %s"
        params.append(duongkinh)
    if chieucao:
        sql += " AND chieucao = %s"
        params.append(chieucao)
    if maphanloai:
        sql += " AND maphanloai = %s"
        params.append(maphanloai)
    if anhminhhoa:
        sql += " AND anhminhhoa = %s"
        params.append(anhminhhoa)
    if madonviqua:
        sql += " AND madonviqua = %s"
        params.append(madonviqua)
    if manhathau:
        sql += " AND manhathau = %s"
        params.append(manhathau)
    if mahopdongq:
        sql += " AND mahopdongq = %s"
        params.append(mahopdongq)
    if mavitri:
        sql += " AND mavitri = %s"
        params.append(mavitri)
    if maloaicay:
        sql += " AND maloaicay = %s"
        params.append(maloaicay)
    try:
        conn = get_connection()
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            cursor.execute(sql, tuple(params))
            rows = cursor.fetchall()

        # Chuyển bytes -> str nếu có
        results = []
        for row in rows:
            clean_row = {k: convert_bytes_to_str(v) for k, v in row.items()}
            results.append(clean_row)

        return jsonify(results if results else [])

    except Exception as e:
        print(f"Error trong tim_kiem_cay: {str(e)}")
        return jsonify({"error": str(e)}), 500


#--------------------------------
# API kiểm tra cây dễ đổ
# Hàm ép kiểu float
def to_float_safe(value):
    try:
        return float(str(value).strip())
    except (ValueError, TypeError):
        return None
@cayxanh_bp.route('/api/cayxanh/duhiemhoa', methods=['GET'])
def lay_gio_tat_ca_cay():
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT fid, loaicay, toadoy AS lat, toadox AS lon, hientrang
            FROM cayxanh
            WHERE toadox IS NOT NULL AND toadoy IS NOT NULL
            And fid >=1600 And fid<=1630
        """)
        danh_sach_cay = cursor.fetchall()
        print(f"Số cây lấy được từ DB: {len(danh_sach_cay)}")
        ket_qua = []

        for cay in danh_sach_cay:
            fid = cay.get('fid', '???')
            tencay = cay.get('loaicay') or 'Không rõ'
            hientrang = (cay.get('hientrang') or '').strip().lower()

            lat_raw = cay.get('lat')
            lon_raw = cay.get('lon')
            lat = to_float_safe(lat_raw)
            lon = to_float_safe(lon_raw)
            
            if lat is None or lon is None:
                continue
            try:
                url = (
                    f"https://api.open-meteo.com/v1/forecast?"
                    f"latitude={lat}&longitude={lon}&current=wind_speed_10m,wind_direction_10m"
                )
                res = requests.get(url)
                if res.status_code != 200:
                    raise Exception(f"API trả về mã lỗi {res.status_code}")
                data = res.json()
                wind_speed = data.get("current", {}).get("wind_speed_10m")
                wind_direction = data.get("current", {}).get("wind_direction_10m")
                # Chỉ thêm cây nếu gió >= 2 và hiện trạng là "sâu mục"
                if wind_speed is not None and wind_speed >= 2 and hientrang == 'sâu mục':
                    ket_qua.append({
                        'fid': fid,
                        'ten_cay': tencay,
                        'lat': lat,
                        'lon': lon,
                        'hientrang': hientrang,
                        'wind_speed': wind_speed,
                        'wind_direction': wind_direction
                    })
                    print(f"Cây FID {fid} đủ điều kiện: gió={wind_speed}, hiện trạng={hientrang}")
                else:
                    print(f"Cây FID {fid} không đủ điều kiện: gió={wind_speed}, hiện trạng={hientrang}")

            except Exception as e:
                ket_qua.append({
                    'fid': fid,
                    'ten_cay': tencay,
                    'lat': lat,
                    'lon': lon,
                    'hientrang': hientrang,
                    'wind_speed': None,
                    'wind_direction': None,
                    'error': str(e)
                })
        cursor.close()
        conn.close()
        return jsonify(ket_qua), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500
    
#--------------------------------
# Lấy dữ liệu trong vùng plygon

@cayxanh_bp.route('/api/cayxanh/trongvung', methods=['POST'])
def cay_trong_vung():
    try:
        data = request.get_json()
        polygon_coords = data.get('polygon')
        if not polygon_coords:
            return jsonify({'error': 'Thiếu polygon'}), 400
        if isinstance(polygon_coords[0], dict):
            polygon_coords = [(p['lng'], p['lat']) for p in polygon_coords]
        poly = Polygon(polygon_coords)
        minx, miny, maxx, maxy = poly.bounds
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM cayxanh
            WHERE toadox BETWEEN %s AND %s AND toadoy BETWEEN %s AND %s
        """, (minx, maxx, miny, maxy))
        rows = cursor.fetchall()
        conn.close()
        cay_trong = []
        for row in rows:
            point = Point(row['toadox'], row['toadoy'])
            if poly.contains(point):
                cay_trong.append(sanitize_row(row))
                x = float(row['toadox'])
                y = float(row['toadoy'])
                point = Point(x, y)
        return jsonify({'count': len(cay_trong), 'trees': cay_trong})
    except Exception as e:
        import traceback
        print("❌ Lỗi xử lý:", traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    



# -------------------------------
# 5. Đăng ký Blueprint và chạy app
# -------------------------------
app.register_blueprint(cayxanh_bp)

if __name__ == '__main__':
    app.run(debug=True)
