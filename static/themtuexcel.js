document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('excelForm');
    const fileInput = document.getElementById('excelFile');
    const resultDiv = document.getElementById('result');
    const fileNameDisplay = document.createElement('div');
    
    
    // Hiển thị tên file đã chọn
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            fileNameDisplay.textContent = 'Đã chọn: ' + this.files[0].name;
        } else {
            fileNameDisplay.textContent = '';
        }
    });
    
    // Chèn tên file vào DOM
    fileInput.parentNode.insertBefore(fileNameDisplay, fileInput.nextSibling);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        if (!file) {
            resultDiv.innerText = 'Vui lòng chọn file Excel!';
            resultDiv.className = 'error'; // Thêm lớp để hiển thị lỗi
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:5500/api/cayxanh/themtuexcel', {
                method: 'POST',
                body: formData
            });

        const result = await response.text();
        resultDiv.innerText = result;
            resultDiv.className = 'success'; // Thêm lớp để hiển thị thành công
        } catch (error) {
            resultDiv.innerText = 'Lỗi khi gửi file.';
            resultDiv.className = 'error'; // Thêm lớp để hiển thị lỗi
            console.error('Lỗi:', error);
        }
    });
});
