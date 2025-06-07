const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
const connectDB = require('./config/db');
const { protect } = require('./middleware/auth');
const { handleExport } = require('./export-handler');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const idcardRoutes = require('./routes/idcardRoutes');
const officialDocumentRoutes = require('./routes/officialDocumentRoutes');

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
app.use('/api', documentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', idcardRoutes);
app.use('/api', officialDocumentRoutes);

// Đảm bảo thư mục uploads tồn tại
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  logger.info('Created uploads directory');
}

// Ensure the uploads/temp directory for ID card uploads exists
const tempUploadsDir = path.join(__dirname, 'uploads/temp');
if (!fs.existsSync(tempUploadsDir)) {
  fs.mkdirSync(tempUploadsDir, { recursive: true });
  logger.info('Created uploads/temp directory for ID card uploads');
}

let modelLoadingProgress = 0;
let modelLoaded = false;
let pythonOcrProcess = null;

// Khởi động Python OCR server
function startPythonOcrServer() {
  logger.info("🔄 Starting Python OCR service...");
  
    // Ensure the Python process has the right environment variables to avoid Sliding Window Attention errors
  pythonOcrProcess = spawn("python", ["server.py"], {
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
            PYTHONWARNINGS: 'ignore::FutureWarning,ignore::UserWarning',
      USE_TORCH_COMPILE: 'False',
            TORCH_CUDNN_V8_API_ENABLED: '0',
            TRANSFORMERS_NO_ADVISORY_WARNINGS: '1',
            TOKENIZERS_PARALLELISM: 'false'
    }
  });
  
  pythonOcrProcess.stdout.on("data", (data) => {
    console.log(`Python OCR: ${data}`);
    // Khi thấy thông báo mô hình đã tải xong từ Python
    if(data.toString().includes("✅ Model loaded successfully!")) {
      modelLoaded = true;
      modelLoadingProgress = 100;
      logger.info("✅ OCR model loaded successfully!");
    } else if(data.toString().includes("🔄 Loading OCR model")) {
      modelLoadingProgress = 30;
        } else if(data.toString().includes("Starting model loading")) {
            modelLoadingProgress = 50;
        } else if(data.toString().includes("Model loaded successfully to")) {
            modelLoadingProgress = 90;
    }
  });
  
  pythonOcrProcess.stderr.on("data", (data) => {
    logger.error(`Python OCR Error: ${data}`);
  });
  
  pythonOcrProcess.on("close", (code) => {
    logger.info(`Python OCR process exited with code ${code}`);
        modelLoaded = false;
    // Tự động khởi động lại nếu quá trình kết thúc
    if (code !== 0) {
      logger.info("🔄 Restarting Python OCR service...");
      setTimeout(startPythonOcrServer, 5000);
    }
  });
}

// Thêm hàm kiểm tra sức khỏe của Python OCR server
async function checkPythonOcrHealth() {
    try {
        if (!modelLoaded) {
            return { status: "loading", progress: modelLoadingProgress };
        }
        
        // Gửi request kiểm tra sức khỏe tới Python server
        const axios = require('axios');
        const response = await axios.get('http://localhost:8000/health', { timeout: 5000 });
        
        if (response.status === 200) {
            return { status: "online", details: response.data };
        } else {
            return { status: "error", message: `Unexpected status: ${response.status}` };
        }
    } catch (error) {
        logger.error(`Error checking Python OCR health: ${error.message}`);
        return { status: "error", message: error.message };
    }
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
        // Kiểm tra sức khỏe của Python OCR service trước khi gửi request
        const healthStatus = await checkPythonOcrHealth();
        
        if (healthStatus.status !== "online") {
            // Nếu service chưa sẵn sàng, thông báo cho client
            if (healthStatus.status === "loading") {
                return res.status(503).json({ 
                    error: "OCR service is still loading", 
                    progress: healthStatus.progress,
                    retry_after: 10 // Gợi ý client thử lại sau 10 giây
                });
            } else {
                // Thử khởi động lại Python OCR service
                logger.info("Attempting to restart Python OCR service due to health check failure");
                if (pythonOcrProcess) {
                    pythonOcrProcess.kill();
                }
                startPythonOcrServer();
                
                return res.status(503).json({ 
                    error: "OCR service is currently unavailable", 
                    message: healthStatus.message,
                    retry_after: 30 // Gợi ý client thử lại sau 30 giây
                });
            }
        }
        
        // Sử dụng axios để gửi request tới Python FastAPI server
        const axios = require('axios');
        const fs = require('fs');
        const FormData = require('form-data');
        
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));
        
        // Nếu có câu hỏi từ client thì gửi đi
        if (req.body.question) {
            formData.append('question', req.body.question);
        } else {
            // Default question optimized for Vietnamese government documents
            const defaultQuestion = "<image>\nPlease extract the full and accurate text of the official Vietnamese government document shown in the image, including the title, issuing agency, document number, date, legal references, main content, clauses, and the name of the signatory (if any). Preserve the structure and formatting (e.g., bullet points, line breaks, numbered articles) as much as possible.";
            formData.append('question', defaultQuestion);
        }
        
        logger.info(`Sending OCR request to Python server with image: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // Gửi request tới Python FastAPI server với timeout dài hơn vì OCR có thể mất thời gian
        const response = await axios.post('http://localhost:8000/ocr', formData, {
            headers: formData.getHeaders(),
            timeout: 120000 // 2 phút timeout
        });
        
        // Xóa file tạm sau khi xử lý
        try {
            fs.unlinkSync(req.file.path);
        } catch (err) {
            logger.warn(`Failed to delete temporary file: ${req.file.path}`);
        }
        
        // Trả kết quả về cho client
        res.json(response.data);
    } catch (error) {
        logger.error('Error during OCR process:', error);
        
        // Xóa file tạm nếu có lỗi
        try {
            if (req.file && req.file.path) {
                fs.unlinkSync(req.file.path);
            }
        } catch (err) {
            // Bỏ qua lỗi khi xóa file
        }
        
        // Trả về thông tin lỗi chi tiết
        const errorResponse = { 
            error: "Error processing image",
            message: error.message
        };
        
        // Thêm chi tiết lỗi từ Python server nếu có
        if (error.response?.data) {
            errorResponse.detail = error.response.data;
        }
        
        res.status(500).json(errorResponse);
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
        logger.error(`Error from Python: ${data}`);
    });

    pythonProcess.on("close", () => {
        modelLoadingProgress = 100;
        modelLoaded = true;
        res.json({ text: output.trim() });
    });
});

// API kiểm tra trạng thái server
app.get("/health", async (req, res) => {
    // Kiểm tra trạng thái của Python OCR service
    const ocrStatus = await checkPythonOcrHealth();
    
    // Thông tin về Node.js server
    const nodeStatus = {
        status: "online",
        version: process.version,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
    };
    
    // Thông tin về MongoDB
    const dbStatus = {
        status: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    };
    
    // Trả về tất cả thông tin trạng thái
    res.json({
        server: nodeStatus,
        pythonOcr: ocrStatus,
        database: dbStatus,
        progress: modelLoadingProgress
    });
});

// Export endpoint - handle document exports
app.post("/export", async (req, res) => {
    try {
        const { content, format, fileName } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: "Content is required" });
        }
        
        if (!format || !['docx', 'pdf'].includes(format)) {
            return res.status(400).json({ error: "Valid format (docx or pdf) is required" });
        }
        
        const safeFileName = (fileName || 'ocr-result').replace(/[^a-zA-Z0-9-_]/g, '_');
        
        logger.info(`📄 Exporting content as ${format} file: ${safeFileName}.${format}`);
        
        const { buffer, mimetype } = await handleExport(content, format, safeFileName);
        
        // Set response headers
        res.setHeader('Content-Type', mimetype);
        res.setHeader('Content-Disposition', `attachment; filename=${safeFileName}.${format}`);
        res.setHeader('Content-Length', buffer.length);
        
        // Send the file
        res.send(buffer);
        
    } catch (error) {
        logger.error('Error during export:', error);
        res.status(500).json({ 
            error: "Error exporting document",
            message: error.message
        });
    }
});

// Xử lý lỗi khi MongoDB mất kết nối
mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  logger.error('MongoDB disconnected, attempting to reconnect...');
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

// Xử lý khi ứng dụng đóng
process.on('SIGINT', async () => {
  try {
    // Đóng kết nối MongoDB
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    
    // Kết thúc Python OCR process nếu đang chạy
    if (pythonOcrProcess) {
      pythonOcrProcess.kill();
      logger.info('Python OCR process terminated.');
    }
    
    logger.info('Server shutting down gracefully.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during graceful shutdown: ${err}`);
    process.exit(1);
  }
});

app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
});