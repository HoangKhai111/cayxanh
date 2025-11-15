const map = L.map('map').setView([21.0285, 105.8542], 15); // Hà Nội
const wmsUrl = 'http://localhost:8080/geoserver/cayxanh/wms';
const layerName = 'cayxanh:cayxanh';

window.treeData = [];
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
let visible1 = true, visible2 = true, visible3 = true;

// Lớp WMS cho từng loại
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

// Toggle Loại 2
document.querySelector('.toggle-loai2').addEventListener('click', function () {
  if (visible2) {
    map.removeLayer(loai2);
    this.innerText = '🟡Bật lớp 1';
  } else {
    map.addLayer(loai2);
    this.innerText = '🟡Tắt lớp 1';
  }
  visible2 = !visible2;
});

// Toggle Loại 3
document.querySelector('.toggle-loai3').addEventListener('click', function () {
  if (visible3) {
    map.removeLayer(loai3);
    this.innerText = '🔴Bật lớp 2';
  } else {
    map.addLayer(loai3);
    this.innerText = '🔴Tắt lớp 2';
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

window.treeInfo = [];
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
        const stt = props.stt || "Không rõ";
        const hientrang = props.hientrang || "Không rõ";
        const phutrach = props.phutrach || "Không rõ";
        const ngaykiemtra = props.ngaykiemtra || "Không rõ";

        // Tạo đối tượng cây xanh
        const treeInfo = {
          stt: stt,
          toadox: toaDoX,
          toadoy: toaDoY,
          loaicay: loaiCay,
          hientrang: hientrang,
          phutrach: phutrach,
          ngaykiemtra: ngaykiemtra
        };

        // Lưu thông tin cây vào mảng treeData
        window.treeData.push(treeInfo);
        console.log('Thông tin cây xanh:', treeInfo);
        // Tạo nội dung popup
        const popupContent = `
          <b>Thông tin cây xanh:</b><br>
          <b>FID:</b> ${stt}<br>
          <b>Tọa độ X:</b> ${toaDoX}<br>
          <b>Tọa độ Y:</b> ${toaDoY}<br>
          <b>Loại cây:</b> ${loaiCay}<br>
          <b>Tình trạng cây:</b> ${hientrang}<br>
          <b>Người phụ trách:</b> ${phutrach}<br>
          <b>Ngày kiểm tra:</b> ${ngaykiemtra}<br>
        `;
        
        // Hiển thị popup
        L.popup()
          .setLatLng(e.latlng)
          .setContent(popupContent)
          .openOn(map);
      }
    })
    .catch(err => {
      console.error('Không thể lấy thông tin:', err);
    });
});


// Tải file CSV
document.getElementById("loadData").addEventListener("click", function () {
  const wfsUrl = "http://localhost:8080/geoserver/wfs?" +
    "service=WFS&version=1.1.0&request=GetFeature&" +
    "typeName=cayxanh:cayxanh&outputFormat=" + encodeURIComponent("application/json") + "&" +
    "CQL_FILTER=" + encodeURIComponent("loai=2 OR loai=3");

  fetch(wfsUrl)
    .then(response => response.json())
    .then(data => {
      const treeList = document.getElementById("treeList");
      treeList.innerHTML = ""; // Xóa nội dung cũ

      data.features.forEach((feature, index) => {
        const prop = feature.properties;
        const coords = feature.geometry?.coordinates || [null, null];

        const tree = {
          fid2: prop.FID2 || index + 1,
          toadox: coords[0],
          toadoy: coords[1],
          loaicay: prop.loaicay || "Không rõ",
          hientrang: prop.hientrang || "Không rõ",
          phutrach: prop.phutrach || "Không rõ",
          noidungphtrach: prop.noidungphtrach || "Không rõ",
          ngaykiemtra: prop.ngaykiemtra || "Không rõ"
        };

        // Tạo một hàng mới cho bảng
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="checkbox" class="tree-checkbox" data-tree='${JSON.stringify(tree)}'></td>
          <td>${tree.fid2}</td>
          <td>${tree.toadox}</td>
          <td>${tree.toadoy}</td>
          <td>${tree.loaicay}</td>
          <td>${tree.hientrang}</td>
          <td>${tree.phutrach}</td>
          <td>${tree.noidungphtrach}</td>
          <td>${tree.ngaykiemtra}</td>
        `;
        treeList.appendChild(row); // Thêm hàng vào bảng
      });

      // Cập nhật sự kiện cho nút "Chọn tất cả"
      document.getElementById("selectAll").addEventListener("change", function () {
        const checked = this.checked;
        document.querySelectorAll(".tree-checkbox").forEach(cb => cb.checked = checked);
      });
    })
    .catch(error => {
      console.error("Lỗi khi gọi GeoServer:", error);
      alert("Không thể lấy dữ liệu từ máy chủ.");
    });

  // Xử lý tải file
  document.getElementById("downloadSelected").addEventListener("click", function () {
    const checkedBoxes = document.querySelectorAll(".tree-checkbox:checked");
    if (checkedBoxes.length === 0) {
      alert("Vui lòng chọn ít nhất một cây!");
      return;
    }

    const headers = ['FID2', 'Tọa độ X', 'Tọa độ Y', 'Loại cây', 'Tình trạng cây', 'Người phụ trách', 'Nội dung phụ trách', 'Ngày kiểm tra'];
    const rows = [headers];

    const escapeCsv = val => `"${String(val).replace(/"/g, '""')}"`;

    checkedBoxes.forEach(box => {
      const tree = JSON.parse(box.getAttribute("data-tree"));
      rows.push([
        escapeCsv(tree.fid2),
        escapeCsv(tree.toadox),
        escapeCsv(tree.toadoy),
        escapeCsv(tree.loaicay),
        escapeCsv(tree.hientrang),
        escapeCsv(tree.phutrach),
        escapeCsv(tree.noidungphtrach),
        escapeCsv(tree.ngaykiemtra)
      ]);
    });

    const bom = '\uFEFF'; // Thêm BOM cho UTF-8
    const csvContent = bom + rows.map(e => e.join(",")).join("\n");
    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cay_trong_vung.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); // Xóa link sau khi tải xong
  });
});
