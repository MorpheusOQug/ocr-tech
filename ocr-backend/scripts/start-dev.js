const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Đường dẫn đến thư mục gốc của project
const rootDir = path.resolve(__dirname, '..');

// Hàm in màu cho console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Kiểm tra các dependencies của Python
function checkPythonDependencies() {
  console.log(`${colors.cyan}Checking Python dependencies...${colors.reset}`);
  
  // Đường dẫn đến file requirements.txt
  const requirementsPath = path.join(rootDir, '..', 'requirements.txt');
  
  if (!fs.existsSync(requirementsPath)) {
    console.log(`${colors.yellow}Warning: requirements.txt not found at ${requirementsPath}${colors.reset}`);
    return;
  }
  
  // Chạy lệnh kiểm tra requirements
  const pipProcess = spawn('pip', ['install', '-r', requirementsPath], {
    // Set environment for Python to force using UTF-8
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      PYTHONWARNINGS: 'ignore::FutureWarning',
      USE_TORCH_COMPILE: 'False',
      TORCH_CUDNN_V8_API_ENABLED: '0'
    }
  });
  
  pipProcess.stdout.on('data', (data) => {
    console.log(`${colors.green}Python deps: ${data}${colors.reset}`);
  });
  
  pipProcess.stderr.on('data', (data) => {
    console.error(`${colors.red}Python deps error: ${data}${colors.reset}`);
  });
  
  pipProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`${colors.green}Python dependencies installed successfully.${colors.reset}`);
    } else {
      console.error(`${colors.red}Failed to install Python dependencies. Exit code: ${code}${colors.reset}`);
    }
  });
}

// Khởi động Node.js server với nodemon
function startNodeServer() {
  console.log(`${colors.cyan}Starting Node.js server with nodemon...${colors.reset}`);
  
  // Set UTF-8 environment variables for Node process
  const nodeProcess = spawn('nodemon', ['server.js'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true, // Windows compatiblity
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1',
      PYTHONWARNINGS: 'ignore::FutureWarning',
      USE_TORCH_COMPILE: 'False',
      TORCH_CUDNN_V8_API_ENABLED: '0'
    }
  });
  
  nodeProcess.on('close', (code) => {
    console.log(`${colors.yellow}Node.js server exited with code ${code}${colors.reset}`);
    // Tắt tất cả các tiến trình khi Node server tắt
    process.exit(code);
  });
  
  return nodeProcess;
}

// Xử lý sự kiện tắt
process.on('SIGINT', () => {
  console.log(`${colors.yellow}Shutting down all services...${colors.reset}`);
  process.exit(0);
});

// Khởi động toàn bộ hệ thống
console.log(`${colors.magenta}Starting OCR System...${colors.reset}`);
checkPythonDependencies();
startNodeServer(); 