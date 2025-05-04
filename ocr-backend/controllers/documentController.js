const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const User = require('../models/User');
const logger = require('../utils/logger');
const driveService = require('../services/googleDriveService');

// Controller cho tài liệu OCR
const documentController = {
  /**
   * Xử lý OCR và lưu kết quả vào database và Google Drive
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async processOCR(req, res) {
    const { file } = req;
    const { mode } = req.body;
    const userId = req.user.id;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      logger.info(`Created uploads directory at ${uploadsDir}`);
    }
    
    // Log file information for debugging
    logger.info(`Processing file: ${file.originalname}, size: ${file.size}, path: ${file.path}`);

    try {
      // Gọi service OCR hiện tại để xử lý
      const ocrResultData = await performOCR(file.path, mode);
      logger.info(`OCR processing completed successfully`);

      // Tạo hoặc lấy thư mục của người dùng trên Google Drive
      let userFolderId = null;
      let driveFile = null;
      
      try {
        // Ensure we have a valid user ID string
        const userIdStr = userId ? userId.toString() : 'public-user';
        logger.info(`Creating folder for user: ${userIdStr}`);
        
        // Sử dụng thư mục cha từ .env file và tạo thư mục người dùng
        userFolderId = await driveService.createUserFolder(userIdStr, `user_${userIdStr}`);
        logger.info(`User folder created/found with ID: ${userFolderId}`);
        
        // Upload file lên Google Drive nếu đã tạo được thư mục
        if (userFolderId) {
          logger.info(`Uploading file ${file.originalname} to Google Drive folder ${userFolderId}`);
          
          // Verify file path exists
          if (!fs.existsSync(file.path)) {
            logger.error(`File not found at path: ${file.path}`);
            throw new Error('Upload file not found on server');
          }
          
          // Upload file lên Drive
          driveFile = await driveService.uploadFile(
            file.path,
            file.originalname,
            userFolderId,
            file.mimetype
          );
          
          logger.info(`File uploaded successfully to Google Drive with ID: ${driveFile.id}`);
          
          // Tạo link chia sẻ
          await driveService.getFileShareLink(driveFile.id);
          logger.info(`Share link created for file ID: ${driveFile.id}`);
        }
      } catch (driveError) {
        logger.error(`Drive error: ${driveError.message}`);
        logger.error(driveError.stack);
        // Continue processing even if Drive operations fail
      }

      // Lưu thông tin tài liệu vào database
      const document = new Document({
        name: file.filename,
        originalName: file.originalname,
        type: file.mimetype.startsWith('image/') ? 'image' : 'document',
        size: file.size,
        userId,
        ocrResult: ocrResultData,
        mode: mode || 'text',
        driveId: driveFile ? driveFile.id : null,
        driveUrl: driveFile ? driveFile.webViewLink : null,
        driveFolderId: userFolderId
      });

      await document.save();

      // Trả về kết quả OCR
      return res.status(200).json({
        ...ocrResultData,
        documentId: document._id,
        driveUrl: driveFile ? driveFile.webViewLink : null,
      });
    } catch (error) {
      logger.error(`Error processing OCR: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Lấy danh sách tài liệu của người dùng
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getUserDocuments(req, res) {
    const userId = req.user.id;
    const { page = 1, limit = 10, search = '' } = req.query;

    try {
      const query = { userId };

      // Thêm điều kiện tìm kiếm nếu có
      if (search) {
        query.$or = [
          { originalName: { $regex: search, $options: 'i' } },
          { type: { $regex: search, $options: 'i' } },
          { mode: { $regex: search, $options: 'i' } },
          // Tìm kiếm trong OCR text - cần kiểm tra cả hai loại cấu trúc kết quả OCR
          { 'ocrResult.text': { $regex: search, $options: 'i' } },
          { 'ocrResult.markdown': { $regex: search, $options: 'i' } }
        ];
      }

      // Đếm tổng số tài liệu
      const totalDocuments = await Document.countDocuments(query);
      
      // Lấy danh sách tài liệu theo phân trang
      const documents = await Document.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean();

      return res.status(200).json({
        documents,
        totalPages: Math.ceil(totalDocuments / limit),
        currentPage: parseInt(page),
        totalDocuments
      });
    } catch (error) {
      logger.error(`Error getting user documents: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Lấy thông tin chi tiết của một tài liệu
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getDocumentById(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const document = await Document.findOne({ _id: id, userId }).lean();

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.status(200).json(document);
    } catch (error) {
      logger.error(`Error getting document details: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Cập nhật thông tin của một tài liệu
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateDocument(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Document name is required' });
    }

    try {
      const document = await Document.findOne({ _id: id, userId });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Update document name
      document.originalName = name;
      
      // Also update file on Google Drive if possible
      if (document.driveId) {
        try {
          await driveService.updateFile(document.driveId, { name });
          logger.info(`Updated file name on Google Drive: ${document.driveId}`);
        } catch (driveError) {
          logger.error(`Failed to update file name on Drive: ${driveError.message}`);
          // Continue even if Drive update fails
        }
      }

      await document.save();
      logger.info(`Document updated successfully: ${id}`);

      return res.status(200).json({ 
        message: 'Document updated successfully',
        document
      });
    } catch (error) {
      logger.error(`Error updating document: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Xóa một tài liệu
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteDocument(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
      const document = await Document.findOne({ _id: id, userId });

      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Xóa file trên Google Drive nếu có
      if (document.driveId) {
        try {
          await driveService.deleteFile(document.driveId);
        } catch (driveError) {
          logger.error(`Failed to delete file from Drive: ${driveError.message}`);
          // Tiếp tục ngay cả khi không xóa được file trên Drive
        }
      }

      // Xóa file từ server
      const localFilePath = path.join(__dirname, '../uploads', document.name);
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      // Xóa tài liệu từ database
      await Document.deleteOne({ _id: id });

      return res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting document: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
  }
};

/**
 * Hàm thực hiện OCR (gọi Python OCR service)
 * @param {string} filePath - Đường dẫn đến file cần OCR
 * @param {string} mode - Chế độ OCR
 * @returns {Promise<Object>} - Kết quả OCR
 */
async function performOCR(filePath, mode) {
  try {
    // Sử dụng axios để gửi request tới Python FastAPI server
    const axios = require('axios');
    const fs = require('fs');
    const FormData = require('form-data');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    // Nếu có chế độ OCR thì gửi đi
    if (mode) {
      formData.append('mode', mode);
    }
    
    // Gửi request tới Python FastAPI server
    const response = await axios.post('http://localhost:8000/ocr', formData, {
      headers: formData.getHeaders()
    });
    
    // Trả về kết quả OCR từ Python server
    return response.data;
  } catch (error) {
    logger.error(`Error during OCR processing: ${error.message}`);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

module.exports = documentController; 