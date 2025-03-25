# Ứng dụng OCR sử dụng Vintern-1B-v3_5

Ứng dụng này giúp trích xuất văn bản từ hình ảnh sử dụng mô hình Vintern-1B-v3_5.

## Cấu trúc dự án

```
├── load_model.py (Mô đun tải mô hình OCR)
├── recognition_image.py (Mô đun nhận diện hình ảnh)
├── Image_storage/ (Thư mục chứa hình ảnh mẫu)
├── ocr-backend/ (Server API backend)
│   ├── server.py (API FastAPI)
│   ├── uploads/ (Thư mục lưu ảnh tải lên)
│   └── ...
└── ocr-frontend/ (Giao diện người dùng)
    ├── src/
    │   ├── App.js (Giao diện chính)
    │   └── ...
    └── ...
```

## Tính năng

- Nhận diện và trích xuất văn bản từ hình ảnh
- Tùy chỉnh câu hỏi cho mô hình qua giao diện chat
- Có sẵn các prompt gợi ý phù hợp với các loại tài liệu khác nhau
- Hiển thị xem trước hình ảnh
- Kiểm tra tình trạng kết nối với server backend

## Yêu cầu

### Backend

- Python 3.8+
- PyTorch
- FastAPI
- Uvicorn
- transformers
- PIL (Pillow)

### Frontend

- Node.js
- npm hoặc yarn
- React

## Cách cài đặt

### Backend

1. **Cài đặt các thư viện Python cần thiết**:

```bash
pip install fastapi uvicorn torch torchvision pillow transformers python-multipart
```

2. **Chuẩn bị thư mục uploads** (nếu chưa có):

```bash
mkdir -p ocr-backend/uploads
```

### Frontend

1. **Cài đặt các packages npm**:

```bash
cd ocr-frontend
npm install
```

## Cách chạy ứng dụng

### Chạy Backend

1. **Khởi động server FastAPI**:

```bash
cd ocr-backend
python server.py
```

Server sẽ chạy ở địa chỉ `http://127.0.0.1:8000`

### Chạy Frontend

1. **Khởi động React app**:

```bash
cd ocr-frontend
npm start
```

Frontend sẽ chạy ở địa chỉ `http://localhost:3000`

## Sử dụng ứng dụng

1. Mở trình duyệt và truy cập địa chỉ `http://localhost:3000`
2. Chọn ảnh từ máy tính của bạn
3. Nhập câu hỏi tùy chỉnh hoặc chọn một prompt gợi ý từ danh sách
4. Nhấn nút "Nhận diện văn bản"
5. Đợi hệ thống xử lý và hiển thị kết quả

### Các prompt mẫu

Ứng dụng cung cấp một số prompt mẫu cho các nhu cầu khác nhau:
- Trích xuất văn bản thuần túy
- Mô tả chi tiết hình ảnh
- Nhận diện văn bản trong ảnh
- Phân tích các bảng và dữ liệu
- Phân tích nội dung tài liệu

## Lưu ý

- Ứng dụng yêu cầu GPU để có hiệu suất tốt nhất
- Mô hình Vintern-1B-v3_5 sẽ được tải tự động lần đầu tiên khi khởi động server
- Đảm bảo câu hỏi luôn bắt đầu bằng `<image>` hoặc hệ thống sẽ tự động thêm vào

## Xử lý lỗi thường gặp

- **Không kết nối được đến server**: Kiểm tra xem server backend đã được khởi động chưa
- **Lỗi CUDA**: Đảm bảo đã cài đặt CUDA toolkit phù hợp với phiên bản PyTorch
- **Lỗi bộ nhớ**: Giảm kích thước ảnh đầu vào hoặc sử dụng GPU có VRAM lớn hơn 