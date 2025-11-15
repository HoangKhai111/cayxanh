const map = L.map('map').setView([21.0285, 105.8542], 15); // Hà Nội
const wmsUrl = 'http://localhost:8080/geoserver/cayxanh/wms';
const layerName = 'cayxanh:cayxanh';

// Thêm nền bản đồ (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

// Lớp dữ liệu từ GeoServer (WMS)
const wmsLayer = L.tileLayer.wms('http://localhost:8080/geoserver/cayxanh/wms', {
  layers: 'cayxanh:cayxanh',
  format: 'image/png',
  transparent: true,
});

// Thêm lớp vào bản đồ lúc đầu
// map.addLayer(wmsLayer);

// Xử lý nút bật/tắt lớp dữ liệu
// let layerVisible = true;
// const toggleBtn = document.querySelector('.battat');
// if (toggleBtn) {
//   toggleBtn.addEventListener('click', () => {
//     if (layerVisible) {
//       map.removeLayer(wmsLayer);
//       toggleBtn.innerText = 'Bật lớp dữ liệu';
//     } else {
//       map.addLayer(wmsLayer);
//       toggleBtn.innerText = 'Tắt lớp dữ liệu';
//     }
//     layerVisible = !layerVisible;
//   });
// }
let visible1 = true, visible2 = true, visible3 = true;

// Lớp WMS cho từng loại
const loai1 = L.tileLayer.wms(wmsUrl, {
  layers: layerName,
  format: 'image/png',
  transparent: true,
  version: '1.1.0',
  CQL_FILTER: 'loai=1'
}).addTo(map);

const loai2 = L.tileLayer.wms(wmsUrl, {
  layers: layerName,
  format: 'image/png',
  transparent: true,
  version: '1.1.0',
  CQL_FILTER: 'loai=2'
}).addTo(map);

const loai3 = L.tileLayer.wms(wmsUrl, {
  layers: layerName,
  format: 'image/png',
  transparent: true,
  version: '1.1.0',
  CQL_FILTER: 'loai=3'
}).addTo(map);

// Toggle Loại 1
document.querySelector('.toggle-loai1').addEventListener('click', function () {
  if (visible1) {
    map.removeLayer(loai1);
    this.innerText = '🟢Bật lớp 1';
  } else {
    map.addLayer(loai1);
    this.innerText = '🟢Tắt lớp 1';
  }
  visible1 = !visible1;
});

// Toggle Loại 2
document.querySelector('.toggle-loai2').addEventListener('click', function () {
  if (visible2) {
    map.removeLayer(loai2);
    this.innerText = '🟡Bật lớp 2';
  } else {
    map.addLayer(loai2);
    this.innerText = '🟡Tắt lớp 2';
  }
  visible2 = !visible2;
});

// Toggle Loại 3
document.querySelector('.toggle-loai3').addEventListener('click', function () {
  if (visible3) {
    map.removeLayer(loai3);
    this.innerText = '🔴Bật lớp 3';
  } else {
    map.addLayer(loai3);
    this.innerText = '🔴Tắt lớp 3';
  }
  visible3 = !visible3;
});
let geojsonLayer = null;
let dataLoaded = false;

function getGeoJSONUrl() {
  return 'http://localhost:8080/geoserver/cayxanh/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=cayxanh:cayxanh&outputFormat=application/json';
}

// Hàm tạo URL lấy dữ liệu cho 1 điểm
function getFeatureInfoUrl(latlng) {
  const point = map.latLngToContainerPoint(latlng, map.getZoom());
  const size = map.getSize();

  const params = {
    service: 'WMS',
    request: 'GetFeatureInfo',
    version: '1.1.1',
    layers: 'cayxanh:cayxanh',
    query_layers: 'cayxanh:cayxanh',
    bbox: map.getBounds().toBBoxString(),
    width: size.x,
    height: size.y,
    srs: 'EPSG:4326',
    format: 'image/png',
    info_format: 'application/json',
    x: Math.round(point.x),
    y: Math.round(point.y)
  };

  const url = 'http://localhost:8080/geoserver/cayxanh/wms?' +
    Object.keys(params)
      .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
      .join('&');
  return url;
}

// Khi bấm vào bản đồ, chỉ lấy dữ liệu tại điểm đó
map.on('click', function (e) {
  fetch(getFeatureInfoUrl(e.latlng))
    .then(res => res.json())
    .then(data => {
      if (data.features && data.features.length > 0) {
        const props = data.features[0].properties;
        const toaDoX = props.toadox || "Không rõ";
        const toaDoY = props.toadoy || "Không rõ";
        const loaiCay = props.loaicay || "Không rõ";
        const FID = props.FID || "Không rõ";
        const hientrang = props.hientrang || "Không rõ";
        // let tinhTrangCay = "Không rõ";
        // if (loai === 1 ) tinhTrangCay = "Tốt";
        // else if (loai === 2) tinhTrangCay = "Cần chăm sóc";
        // else if (loai === 3) tinhTrangCay = "Cần chặt bỏ";
        const popupContent = `
          <b>Thông tin cây xanh:</b><br>
          <b>FID:</b> ${FID}<br
          <b>Tọa độ X:</b> ${toaDoX}<br>
          <b>Tọa độ Y:</b> ${toaDoY}<br>
          <b>Loại cây:</b> ${loaiCay}<br>
          <b>Tình trạng cây:</b> ${hientrang}<br>
        `;
        L.popup()
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(map);
      // } else {
      //   L.popup()
      //     .setLatLng(e.latlng)
      //     .setContent('Không có dữ liệu tại đây')
      //     .openOn(map);
      }
    })
    .catch(err => {
      console.error('Không thể lấy thông tin:', err);
    });
});

const mapContainer = map.getContainer();

// Khi bắt đầu kéo 
map.on('mousedown', function () {
  mapContainer.style.cursor = 'grabbing';
});

// Khi thả chuột ra
map.on('mouseup', function () {
  mapContainer.style.cursor = 'default';
});

// Khi chuột rời khỏi bản đồ
map.on('mouseout', function () {
  mapContainer.style.cursor = 'default';
});
  const timKiemBtn = document.getElementById('timkiem-btn');
  const searchBox = document.getElementById('search-box');
  const searchInput = document.getElementById('search-input');
  const searchAct = document.getElementById('search_act');

  if (timKiemBtn && searchBox) {
    timKiemBtn.addEventListener('click', () => {
      // Toggle hiển thị
      if (searchBox.style.display === 'none' || searchBox.style.display === '') {
        searchBox.style.display = 'block';
      } else {
        searchBox.style.display = 'none';
      }
    });
  }

// Xử lý sự kiện tìm kiếm
if (searchAct && searchInput) {
  searchAct.addEventListener('click', () => {
    const FID2 = searchInput.value.trim();
    if (!FID2) {
      alert("Bạn cần nhập STT cây xanh!");
      return;
    }

    fetch(`http://localhost:5000/api/cayxanh/timkiem_stt?FID2=${encodeURIComponent(FID2)}`)
      .then(res => {
        if (!res.ok) throw new Error("Không tìm thấy cây với FID đã nhập");
        return res.json();
      })
      .then(feature => {
        const coords = feature.geometry.coordinates;
        const props = feature.properties;

        // let tinhTrangCay = "Không rõ";
        // if (props.loai === 1 || props.loai === "1") tinhTrangCay = "Tốt";
        // else if (props.loai === 2 || props.loai === "2") tinhTrangCay = "Cần chăm sóc";
        // else if (props.loai === 3 || props.loai === "3") tinhTrangCay = "Cần chặt bỏ";

        map.setView([coords[1], coords[0]], 18);
        L.marker([coords[1], coords[0]])
          .addTo(map)
          .bindPopup(`
            <b>Thông tin cây xanh:</b><br>
            <b>FID:</b> ${props.FID2}<br>
            <b>Tọa độ X:</b> ${props.toadox}<br>
            <b>Tọa độ Y:</b> ${props.toadoy}<br>
            <b>Loại cây:</b> ${props.loaicay}<br>
            <b>Tình trạng cây:</b> ${props.hientrang}<br>
          `)
          .openPopup();
      })
      .catch(err => {
        alert(err.message || "Lỗi tìm kiếm cây!");
      });
  });
  // Hiển thị tọa độ chuột
  map.on('mousemove', function (e) {
    const mousePosition = document.getElementById('mouse-position');
    if (mousePosition) {
      mousePosition.innerText = `Tọa độ: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
    }
  });
}

// Công cụ đo khoảng cách
map.pm.addControls({
  position: 'topleft',
  drawMarker: true,
  drawCircle: false,
  drawPolyline: true,   
  drawPolygon: true,   
  editMode: true,
  removalMode: true
});

// Khi tạo một đường hoặc đa giác
map.on('pm:create', (e) => {
  const layer = e.layer;
  
  // Thêm sự kiện click cho layer
  layer.on('click', () => {
    if (e.shape === 'Line') {
      const latlngs = layer.getLatLngs();
      let distance = 0;

      for (let i = 0; i < latlngs.length - 1; i++) {
        distance += latlngs[i].distanceTo(latlngs[i + 1]);
      }

      const popup = L.popup()
        .setLatLng(latlngs[latlngs.length - 1])
        .setContent(`Chiều dài: ${distance.toFixed(2)} mét`)
        .openOn(map);
    }
    
    if (e.shape === 'Polygon') {
      const latlngs = layer.getLatLngs()[0];
      let area = L.GeometryUtil.geodesicArea(latlngs);

      const popup = L.popup()
        .setLatLng(latlngs[0])
        .setContent(`Diện tích: ${area.toFixed(2)} mét vuông`)
        .openOn(map);
    }
  });

  // Nếu là Line, tính chiều dài và hiển thị popup
  if (e.shape === 'Line') {
    const latlngs = layer.getLatLngs();
    let distance = 0;

    for (let i = 0; i < latlngs.length - 1; i++) {
      distance += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    const popup = L.popup()
      .setLatLng(latlngs[latlngs.length - 1])
      .setContent(`Chiều dài: ${distance.toFixed(2)} mét`)
      .openOn(map);
  }

  // Nếu là Polygon, tính diện tích và hiển thị popup
  if (e.shape === 'Polygon') {
    const latlngs = layer.getLatLngs()[0];
    let area = L.GeometryUtil.geodesicArea(latlngs);

    const popup = L.popup()
      .setLatLng(latlngs[0])
      .setContent(`Diện tích: ${area.toFixed(2)} mét vuông`)
      .openOn(map);
  }
});

//-------------------

// Xử lý sự kiện vẽ và lấy thông tin cây xanh
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  edit: { featureGroup: drawnItems },
  draw: { polygon: true, marker: false, polyline: false, rectangle: false, circle: false, circlemarker: false }
});
map.addControl(drawControl);

// Khi người dùng vẽ xong
map.on(L.Draw.Event.CREATED, function (e) {
  const layer = e.layer;
  drawnItems.clearLayers();
  drawnItems.addLayer(layer);

  const coords = layer.getLatLngs()[0].map(pt => [pt.lng, pt.lat]); // chỉ lấy vòng ngoài (lng, lat)

  fetch('http://localhost:5000/api/cayxanh/trongvung', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ polygon: coords })
  })
    .then(res => {
      if (!res.ok) {
        throw new Error('Network response was not ok');
      } 
      return res.json();
    })
    .then(data => {
      if (data.error) {
        alert(`Lỗi: ${data.error}`);
      } else {
        alert(`Có ${data.count} cây trong vùng chọn.`);
        console.log(data.trees); // hiện thị dữ liệu cây để in bảng/export CSV
        // Lưu dữ liệu vào biến toàn cục để sử dụng trong hàm xuatCSV
        window.treeData = data.trees;
        const tbody = document.querySelector('#bangCayXanh tbody');
tbody.innerHTML = ''; // Xóa dữ liệu cũ

data.trees.forEach((cay, i) => {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${cay.FID}</td>
    <td>${cay.loaicay}</td>
    <td>${cay.toadox}</td>
    <td>${cay.toadoy}</td>
  `;
  tbody.appendChild(row);
});
      }
    })
    .catch(err => console.error('Fetch error:', err));
});

// Hàm xuất dữ liệu cây xanh ra CSV
function xuatCSV() {
  if (!window.treeData || window.treeData.length === 0) {
    alert('Không có dữ liệu để xuất.');
    return;
  }
  let rows = [['FID', 'Loại cây', 'Tọa độ X', 'Tọa độ Y']];
  window.treeData.forEach((cay, i) => {
    rows.push([cay.FID, cay.loaicay, cay.toadox, cay.toadoy]);
  });

  const bom = '\uFEFF';
  const csvContent = bom + rows.map(e => e.join(",")).join("\n");
  const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "cay_trong_vung.csv");
  document.body.appendChild(link);
  link.click();
};

function toggleBang() {
  const div = document.getElementById('left_left');
  const label = document.querySelector('.thechu');
  // Chuyển đổi giữa hiện và ẩn
  if (div.style.display === 'none' || div.style.display === '') {
    div.style.display = 'block';
    document.querySelector('.thechu').innerHTML = 'Đóng dữ liệu'; // đang hiện
  } else {
    div.style.display = 'none';
    document.querySelector('.thechu').innerHTML = 'Mở dữ liệu'; // đang ẩn
    document.querySelector('.thechu').style.magrin = '150px';
  }
}

