const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const connectDB = require('./config/db');
const { protect } = require('./middleware/auth');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Cấu hình Multer để lưu ảnh upload
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

// Register routes
app.use('/api/auth', authRoutes);

let modelLoadingProgress = 0;
let modelLoaded = false;
let pythonOcrProcess = null;

// Khởi động Python OCR server
function startPythonOcrServer() {
  console.log("🔄 Starting Python OCR service...");
  
  pythonOcrProcess = spawn("python", ["server.py"], {
    // Đặt biến môi trường UTF-8 cho Python
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      PYTHONWARNINGS: 'ignore::FutureWarning',
      USE_TORCH_COMPILE: 'False',
      TORCH_CUDNN_V8_API_ENABLED: '0'
    }
  });
  
  pythonOcrProcess.stdout.on("data", (data) => {
    console.log(`Python OCR: ${data}`);
    // Khi thấy thông báo mô hình đã tải xong từ Python
    if(data.toString().includes("✅ Model loaded successfully!")) {
      modelLoaded = true;
      modelLoadingProgress = 100;
      console.log("✅ OCR model loaded successfully!");
    } else if(data.toString().includes("🔄 Loading OCR model")) {
      modelLoadingProgress = 30;
    }
  });
  
  pythonOcrProcess.stderr.on("data", (data) => {
    console.error(`Python OCR Error: ${data}`);
  });
  
  pythonOcrProcess.on("close", (code) => {
    console.log(`Python OCR process exited with code ${code}`);
    // Tự động khởi động lại nếu quá trình kết thúc
    if (code !== 0) {
      console.log("🔄 Restarting Python OCR service...");
      setTimeout(startPythonOcrServer, 5000);
    }
  });
}

// Khởi động Python OCR server khi Node.js server khởi động
startPythonOcrServer();

// API kiểm tra tiến trình tải mô hình
app.get("/model-progress", (req, res) => {
    res.json({ progress: modelLoadingProgress, loaded: modelLoaded });
});

// API OCR sử dụng Python server
app.post("/api/ocr", upload.single("image"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Please upload your image" });
    }

    try {
        // Sử dụng axios để gửi request tới Python FastAPI server
        const axios = require('axios');
        const fs = require('fs');
        const FormData = require('form-data');
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        
        // Nếu có câu hỏi từ client thì gửi đi
        if (req.body.question) {
            formData.append('question', req.body.question);
        }
        
        // Gửi request tới Python FastAPI server
        const response = await axios.post('http://localhost:8000/ocr', formData, {
            headers: formData.getHeaders()
        });
        
        // Trả kết quả về cho client
        res.json(response.data);
    } catch (error) {
        console.error('Error during OCR process:', error);
        res.status(500).json({ 
            error: "Error processing image",
            message: error.message,
            detail: error.response?.data || 'No additional details'
        });
    }
});

// API nhận ảnh (phương thức cũ dùng test.py)
app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "Please upload your image" });
    }

    // Bắt đầu tải mô hình
    modelLoadingProgress = 0;
    modelLoaded = false;

    // Chạy mô hình OCR bằng Python
    const pythonProcess = spawn("python", ["test.py", req.file.path], {
        env: {
            ...process.env,
            PYTHONIOENCODING: 'utf-8',
            PYTHONUTF8: '1',
            PYTHONWARNINGS: 'ignore::FutureWarning',
            USE_TORCH_COMPILE: 'False',
            TORCH_CUDNN_V8_API_ENABLED: '0'
        }
    });

    let output = "";

    pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
        modelLoadingProgress += 30;
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error(`Error from Python: ${data}`);
    });

    pythonProcess.on("close", () => {
        modelLoadingProgress = 100;
        modelLoaded = true;
        res.json({ text: output.trim() });
    });
});

// API kiểm tra trạng thái server
app.get("/health", (req, res) => {
    res.json({ 
        status: "online",
        pythonOcr: modelLoaded ? "online" : "loading",
        progress: modelLoadingProgress
    });
});

// Xử lý khi server Node.js tắt
process.on('SIGINT', () => {
    console.log('Shutting down...');
    if (pythonOcrProcess) {
        pythonOcrProcess.kill();
    }
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
    console.log('MongoDB connection established');
});