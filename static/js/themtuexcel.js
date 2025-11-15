document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('excelForm');
    const fileInput = document.getElementById('excelFile');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            resultDiv.innerText = 'Vui lòng chọn file Excel!';
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5000/api/cayxanh/themtuexcel', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            resultDiv.innerText = JSON.stringify(result, null, 2);
        } catch (error) {
            resultDiv.innerText = 'Lỗi khi gửi file.';
            console.error('Lỗi:', error);
        }
    });
});