let lastSearchData = [];
document.getElementById('timkiem').addEventListener('click', () => {
  const fid = document.getElementById('fid').value.trim();
  const loai = document.getElementById('loai').value.trim();
  const hientrang = document.getElementById('hientrang').value.trim();
  const loaicay = document.getElementById('loaicay').value.trim();
  const phutrach = document.getElementById('phutrach').value.trim();
  const noidungphtrach = document.getElementById('noidungphtrach').value.trim();
  const ngaykiemtra = document.getElementById('ngaykiemtra').value.trim();
  const diachi = document.getElementById('diachi').value.trim();
  const matuyencay = document.getElementById('matuyencay').value.trim();
  const duongkinh = document.getElementById('duongkinh').value.trim();
  const chieucao = document.getElementById('chieucao').value.trim();
  const maphanloai = document.getElementById('maphanloai').value.trim();
  const anhminhhoa = document.getElementById('anhminhhoa').value.trim();
  const madonviqua = document.getElementById('madonviqua').value.trim();
  const manhathau = document.getElementById('manhathau').value.trim();
  const mahopdongq = document.getElementById('mahopdongq').value.trim();
  const mavitri = document.getElementById('mavitri').value.trim();
  const maloaicay = document.getElementById('maloaicay').value.trim();

  const params = new URLSearchParams();
  if (fid) params.append('fid', fid);
  if (loai) params.append('loai', loai);
  if (hientrang) params.append('hientrang', hientrang);
  if (loaicay) params.append('loaicay', loaicay);
  if (phutrach) params.append('phutrach', phutrach);
  if (noidungphtrach) params.append('noidungphtrach', noidungphtrach);
  if (ngaykiemtra) params.append('ngaykiemtra', ngaykiemtra);
  if (diachi) params.append('diachi',diachi);
  if (matuyencay) params.append('matuyencay',matuyencay);
  if (duongkinh) params.append('duongkinh',duongkinh);
  if (chieucao) params.append('chieucao',chieucao);
  if (maphanloai) params.append('maphanloai',maphanloai);
  if (anhminhhoa) params.append('anhminhhoa',anhminhhoa);
  if (madonviqua) params.append('madonviqua',madonviqua);
  if (manhathau) params.append('manhathau',manhathau);
  if (mahopdongq) params.append('mahopdongq',mahopdongq);
  if (mavitri) params.append('mavitri',mavitri);
  if (maloaicay) params.append('maloaicay',maloaicay);


  fetch(`http://localhost:5500/api/cayxanh/timkiem?${params.toString()}`)
    .then(res => {
      if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      lastSearchData = data; // Lưu dữ liệu tìm kiếm để tải CSV sau này
      window.lastSearchData = data;
      console.log("Kết quả:", data);
      const container = document.getElementById('ketqua');
      container.innerHTML = '';

      if (Array.isArray(data) && data.length > 0) {
        let html = `
          <table border="1" cellpadding="6" cellspacing="0" style="width: 100%;">
            <thead>
              <tr>
                <th>FID</th>
                <th>Tọa độ X</th>
                <th>Tọa độ Y</th>
                <th>Loại cây</th>
                <th>Hiện trạng</th>
                <th>Người phụ trách</th>
                <th>Nội dung kiểm tra</th>
                <th>Ngày kiểm tra</th>
                <th>Địa chỉ</th>
                <th>Mã tuyến cây</th>
                <th>Đường kính</th>
                <th>Chiều cao</th>
                <th>Mã phân loại</th>
                <th>Ảnh minh họa</th>
                <th>Mã đơn vị</th>
                <th>Mã nhà thầu</th>
                <th>Mã hợp đồng</th>
                <th>Mã vị trí</th>
                <th>Mã loại cây</th>
              </tr>
            </thead>
            <tbody>
        `;

        data.forEach(item => {
          html += `
            <tr>
              <td>${item.FID || ''}</td>
              <td>${item.toadox || ''}</td>
              <td>${item.toadoy || ''}</td>
              <td>${item.loaicay || ''}</td>
              <td>${item.hientrang || ''}</td>
              <td>${item.phutrach || ''}</td>
              <td>${item.noidungphtrach || ''}</td>
              <td>${item.ngaykiemtra || ''}</td>
              <td>${item.diachi || ''}</td>
              <td>${item.matuyencay || ''}</td>
              <td>${item.duongkinh || ''}</td>
              <td>${item.chieucao || ''}</td>
              <td>${item.maphanloai || ''}</td>
              <td>${item.anhminhhoa || ''}</td>
              <td>${item.madonviqua || ''}</td>
              <td>${item.manhathau || ''}</td>
              <td>${item.mahopdongq || ''}</td>
              <td>${item.mavitri || ''}</td>
              <td>${item.maloaicay || ''}</td>
            </tr>
          `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
      } else {
        container.innerHTML = '<p>Không tìm thấy kết quả.</p>';
      }
      console.log("🔎 Gọi API:", `/api/cayxanh/timkiem?${params.toString()}`);
    })
    .catch(err => {
      console.error("❌ Lỗi khi gọi API:", err);
      alert("Lỗi khi tìm kiếm.");
    });
});

document.getElementById('taicsv').addEventListener('click', () => {
  const data = window.lastSearchData || [];

  if (!data || data.length === 0) {
    alert("Không có dữ liệu để tải");
    return;
  }

  // Tiêu đề các cột
  const headers = ['FID', 'Tọa độ X', 'Tọa độ Y', 'Loại cây', 'Hiện trạng', 'Người phụ trách', 'Nội dung kiểm tra', 'Ngày kiểm tra'];
  const rows = [headers];

  // Duyệt qua dữ liệu cây
  data.forEach(cay => {
    rows.push([
      cay.FID || '',
      cay.toadox || '',
      cay.toadoy || '',
      cay.loaicay || '',
      cay.hientrang || '',
      cay.phutrach || '',
      cay.noidungphtrach || '',
      cay.ngaykiemtra || ''
    ]);
  });

  // Tạo nội dung CSV
  const bom = '\uFEFF'; // để Excel đọc tiếng Việt
  const csvContent = bom + rows.map(e => e.join(",")).join("\n");

  // Tạo link tải
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "cay_trong_vung.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // cleanup
});
