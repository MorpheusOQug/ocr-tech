# Ứng dụng OCR sử dụng Vintern-1B-v3_5

Ứng dụng này giúp trích xuất văn bản từ hình ảnh sử dụng mô hình Vintern-1B-v3_5.

## Cấu trúc dự án

```
├── ocr-backend/ (Server API backend)
│   ├── server.js (Node.js Express Server)
│   ├── server.py (Python FastAPI Server)
│   ├── load_model.py (Mô đun tải mô hình OCR)
│   ├── controllers/ (Xử lý logic nghiệp vụ)
│   ├── models/ (Mô hình dữ liệu)
│   ├── routes/ (Định tuyến API)
│   ├── middleware/ (Middleware xử lý)
│   ├── services/ (Các dịch vụ)
│   ├── utils/ (Tiện ích)
│   ├── uploads/ (Thư mục lưu ảnh tải lên)
│   ├── config/ (Cấu hình)
│   └── scripts/ (Scripts tiện ích)
└── ocr-frontend/ (Giao diện người dùng)
    ├── src/ (Mã nguồn React)
    ├── public/ (Tài nguyên tĩnh)
    └── build/ (Thư mục build)
```

## Tính năng

- Nhận diện và trích xuất văn bản từ hình ảnh
- Tùy chỉnh câu hỏi cho mô hình qua giao diện chat
- Có sẵn các prompt gợi ý phù hợp với các loại tài liệu khác nhau
- Hiển thị xem trước hình ảnh
- Kiểm tra tình trạng kết nối với server backend

## Yêu cầu hệ thống

### Backend
- Python 3.8+
- Node.js 14+ và npm
- CUDA toolkit (cho GPU acceleration)
- Virtual environment (venv) cho Python

### Frontend
- Node.js 14+
- npm hoặc yarn

## Cách cài đặt

### Backend

1. **Tạo và kích hoạt môi trường ảo Python**:

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

2. **Cài đặt các thư viện Python**:

```bash
cd ocr-backend
pip install -r requirements.txt
```

3. **Cài đặt các dependencies Node.js**:

```bash
cd ocr-backend
npm install
```

4. **Chuẩn bị thư mục uploads**:

```bash
mkdir -p uploads
```

### Frontend

1. **Cài đặt các dependencies**:

```bash
cd ocr-frontend
npm install
```

## Cách chạy ứng dụng

### Chạy Backend

1. **Khởi động Python FastAPI server** (trong môi trường ảo):

```bash
# Bỏ qua nếu chạy npm run dev rồi, việc này dành riêng cho chạy model Vintern
python server.py
```

2. **Khởi động Node.js server**:

```bash
# Trong một terminal khác, cũng ở thư mục ocr-backend
npm run dev
```

Server FastAPI sẽ chạy ở địa chỉ `http://127.0.0.1:8000`
Server Node.js sẽ chạy ở địa chỉ `http://localhost:5000`

### Chạy Frontend

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