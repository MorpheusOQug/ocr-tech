const winston = require('winston');
const path = require('path');

// Định nghĩa các level của log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Màu sắc cho từng level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Thêm màu sắc cho winston
winston.addColors(colors);

// Format log
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Các transports
const transports = [
  // Console
  new winston.transports.Console(),
  // Error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  // All logs
  new winston.transports.File({ filename: 'logs/all.log' }),
];

// Khởi tạo logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports,
});

module.exports = logger; 