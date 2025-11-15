let dulieucay = [];
const map = L.map('map').setView([21.0285, 105.8542], 15); // Hà Nội
const wmsUrl = 'http://localhost:8080/geoserver/cayxanh/wms';
const layerName = 'cayxanh:cayxanh';

const cayIcon = L.icon({
  iconUrl: 'chuy.png', // Đường dẫn đến file ảnh icon
  iconSize: [32, 32],          // Kích thước icon [width, height]
  iconAnchor: [16, 32],        // Điểm neo của icon (góc dưới giữa)
  popupAnchor: [0, -32]        // Vị trí hiển thị popup so với icon
});
// Thêm nền bản đồ (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

fetch('http://localhost:5000/api/cayxanh/duhiemhoa')
  .then(res => res.json())
  .then(data => {
    let count = 0;
    const tbody = document.querySelector('#banghiemhoa tbody');
    data.forEach(cay => {
      // Kiểm tra điều kiện: gió >= 5 và hiện trạng là "Sâu mục"
      if (
        cay.lat && cay.lon &&
        cay.wind_speed !== null && cay.wind_speed >=2 && // sửa lại tốc độ gió ////////////
        cay.hientrang && cay.hientrang.toLowerCase().trim() === 'sâu mục'
      ) {
        const popup = `
          <b>${cay.ten_cay}</b><br/>
          Hiện trạng: ${cay.hientrang}<br/>
          Tốc độ gió: ${cay.wind_speed.toFixed(1)} m/s<br/>
          Hướng gió: ${cay.wind_direction !== null ? cay.wind_direction.toFixed(0) : 'N/A'}° <br/>
          Cây dễ đổ, cần chú ý!
          <br/>
          `;
        L.marker([cay.lat, cay.lon], {
          icon: cayIcon})
          .addTo(map)
          .bindPopup(popup);
      const row = `
          <tr>
            <td>${cay.fid || ''}</td>
            <td>${cay.ten_cay || ''}</td>
            <td>${cay.lat || ''}</td>
            <td>${cay.lon || ''}</td>
          </tr>`;
          tbody.innerHTML += row;
          dulieucay.push (cay);
      }
    });
  })

  // xuất csv
  function xuatCSV() {
  if (!dulieucay || dulieucay.length === 0) {
    alert('Không có dữ liệu để xuất.');
    return;
  }

  let rows = [['FID', 'Tên cây', 'Tọa độ X', 'Tọa độ Y']];
  dulieucay.forEach(cay => {
    rows.push([
      cay.fid || '',
      cay.ten_cay || '',
      cay.lon || '',
      cay.lat || ''
    ]);
  });

  const bom = '\uFEFF';
  const csvContent = bom + rows.map(e => e.join(",")).join("\n");
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "cay_nguy_hiem.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link); // cleanup
  }
