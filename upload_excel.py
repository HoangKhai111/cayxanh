import pandas as pd
from db_config import get_connection
def import_excel(file_path):
    df = pd.read_excel(file_path)
    conn = get_connection()
    cursor = conn.cursor()
    for index, row in df.iterrows():
        try:
            diachi = row['diachi']
            toadox = float(row['toadox'])
            toadoy = float(row['toadoy'])
            masocay = row['masocay']
            loaicay = row['loaicay']
            duongkinh = row['duongkinh']
            chieucao = row['chieucao']
            hientrang = row['hientrang']
            maphanloai = row['maphanloai']
            caytrongco = row['caytrongco']
            matuyencay = row['matuyencay']
            anhminhhoa = row['anhminhhoa']
            kehoachduy = row['kehoachduy']
            lichsucayb = row['lichsucayb']
            madonviqua = row['madonviqua']
            manhathau = row['manhathau']
            mahopdongq = row['mahopdongq']
            mahientran = row['mahientran']
            vitri = row['vitri']
            maloaicay = row['maloaicay']
            stt = int(row['stt'])
            geom = f'POINT({toadox} {toadoy})'
            insert_query = """
                    INSERT INTO cayxanh (diachi,toadox,toadoy,masocay,loaicay,duongkinh,chieucao,hientrang,
                    maphanloai,caytrongco,matuyencay,anhminhhoa,
                    kehoachduy,lichsucayb,madonviqua,manhathau,mahopdongq,mahientran,vitri,
                    maloaicay, stt, geom)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s,%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, ST_PointFromText(%s, 4326))
            """
            cursor.execute(insert_query, (diachi,toadox,toadoy,masocay,loaicay,duongkinh,chieucao,hientrang,
                    maphanloai,caytrongco,matuyencay,anhminhhoa,
                    kehoachduy,lichsucayb,madonviqua,manhathau,mahopdongq,mahientran,vitri,
                    maloaicay, stt, geom))
        except Exception as e:
            print(f"❌ Lỗi ở dòng {index + 1}: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    print(" Nhập xong dữ liệu Excel")