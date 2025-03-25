const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 5000;

// Cấu hình Multer để lưu ảnh upload
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

let modelLoadingProgress = 0; // Theo dõi tiến trình tải mô hình
let modelLoaded = false; // Trạng thái mô hình đã tải xong chưa

// API kiểm tra tiến trình tải mô hình
app.get("/model-progress", (req, res) => {
    res.json({ progress: modelLoadingProgress, loaded: modelLoaded });
});

// API nhận ảnh, chạy OCR, trả về kết quả
app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Please upload your image" });
    }

    // Bắt đầu tải mô hình (giả lập từng bước)
    modelLoadingProgress = 0;
    modelLoaded = false;

    // Chạy mô hình OCR bằng Python
    const pythonProcess = spawn("python3", ["test.py", req.file.path]);

    let output = "";

    pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
        modelLoadingProgress += 30; // Tăng tiến trình tải lên 30% mỗi lần nhận dữ liệu
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error(`Lỗi từ Python: ${data}`);
    });

    pythonProcess.on("close", () => {
        modelLoadingProgress = 100; // Khi tải xong, đặt 100%
        modelLoaded = true;
        res.json({ text: output.trim() });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server run in: http://localhost:${PORT}`);
});