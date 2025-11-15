document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('updateForm');
    const resultDiv = document.getElementById('result');
    const fidInput = document.getElementById('fid');

    let originalData = {}; // Dữ liệu gốc từ server

    // Hàm lấy dữ liệu cây theo FID
    async function fetchOriginalData(fid) {
        try {
            const res = await fetch(`http://localhost:5500/api/cayxanh/thongtin?fid=${fid}`);
            const data = await res.json();
            if (data.error) {
                resultDiv.innerText = ` ${data.error}`;
                return;
            }
            originalData = data;
            for (const key in data) {
                if (key === 'geom') continue;
            }

            resultDiv.innerText = ' Dữ liệu đã được tải thành công.';
        } catch (err) {
            console.error('Không thể lấy dữ liệu gốc:', err);
            resultDiv.innerText = ' Lỗi khi lấy dữ liệu từ server.';
        }
    }
    // Khi người dùng nhập FID và rời khỏi ô input, tự động lấy dữ liệu gốc
    fidInput.addEventListener('blur', () => {
        const fid = fidInput.value;
        if (fid) {
            fetchOriginalData(fid);
        }
    });
    // Gửi dữ liệu cập nhật
    sua.addEventListener('click', async (e) => {
        e.preventDefault();

        const fid = fidInput.value;
        const updatedData = { fid }; // Luôn cần FID

        for (const key in originalData) {
            if (key === 'fid' || key === 'geom') continue;

            const input = document.getElementById(key);
            if (!input) continue;

            const newValue = input.value.trim();
            const oldValue = originalData[key] != null ? originalData[key].toString().trim() : '';

            // Nếu người dùng thực sự thay đổi giá trị => thêm vào dữ liệu gửi đi
            if (newValue !== '' && newValue !== oldValue) {
                updatedData[key] = newValue;}
        }
        try {
            const response = await fetch('http://localhost:5500/api/cayxanh/sua', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

const result = await response.text();
resultDiv.innerText = result;
        } catch (error) {
            resultDiv.innerText = ' Lỗi khi gửi yêu cầu cập nhật';
            console.error(error);
        }
    });
});

