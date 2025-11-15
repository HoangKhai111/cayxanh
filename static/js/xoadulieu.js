document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('deleteForm');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fidInput = document.getElementById('fid').value.trim();
        if (!fidInput) {
            resultDiv.innerText = 'Vui lòng nhập FID cần xóa (cách nhau bằng dấu phẩy)';
            return;
        }

        if (!confirm(`Bạn có chắc muốn xóa các FID: ${fidInput}?`)) return;

        try {
            const response = await fetch(`http://localhost:5000/api/cayxanh/xoa?fid=${encodeURIComponent(fidInput)}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            resultDiv.innerText = JSON.stringify(result, null, 2);
        } catch (error) {
            resultDiv.innerText = 'Lỗi khi gửi yêu cầu xóa';
            console.error(error);
        }
    });
});
