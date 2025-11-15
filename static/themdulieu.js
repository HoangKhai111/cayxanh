document.getElementById('them').addEventListener('click', function () {
  const data = {
    toadox: document.getElementById('toadox').value,
    toadoy: document.getElementById('toadoy').value,
    diachi: document.getElementById('diachi').value,
    masocay: document.getElementById('masocay').value,
    loaicay: document.getElementById('loaicay').value,
    duongkinh: document.getElementById('duongkinh').value,
    chieucao: document.getElementById('chieucao').value,
    hientrang: document.getElementById('hientrang').value,
    maphanloai: document.getElementById('maphanloai').value,
    mahientrang: document.getElementById('mahientrang').value,
    maloaicay: document.getElementById('maloaicay').value,
    vitri: document.getElementById('vitri').value,
    stt: document.getElementById('stt').value,
    matuyencay: document.getElementById('matuyencay').value,
    anhminhhoa: document.getElementById('anhminhhoa').value,
    lichsucayb: document.getElementById('lichsucayb').value,
    manhathau: document.getElementById('manhathau').value,
    mahopdongq: document.getElementById('mahopdongq').value,
    loai: document.getElementById('loai').value,
  };

  fetch('http://localhost:5500/api/cayxanh/them', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  .then(res => res.json())
.then(result => {
  if (result.FID) {
    alert(`${result.message}\nFID mới: ${result.FID}`);
  } else {
    alert(`${result.message || result.error}`);
  }
})
  .catch(error => {
    console.error('Lỗi:', error);
  });
});