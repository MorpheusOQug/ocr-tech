const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
require('dotenv').config();

class GoogleDriveService {
  constructor() {
    this.initialize();
    this.parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
  }

  initialize() {
    try {
      // Đường dẫn đến file key
      const keyPath = path.join(__dirname, '../config/google-drive-key.json');
      const keyFile = fs.readFileSync(keyPath);
      const credentials = JSON.parse(keyFile);

      // Khởi tạo JWT client
      const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        credentials.private_key,
        ['https://www.googleapis.com/auth/drive']
      );

      // Khởi tạo Drive client
      this.drive = google.drive({ version: 'v3', auth });
      this.initialized = true;
      logger.info('Google Drive service initialized successfully');
    } catch (error) {
      this.initialized = false;
      logger.error('Failed to initialize Google Drive service:', error);
    }
  }

  /**
   * Tạo thư mục cho người dùng
   * @param {string} userId - ID người dùng
   * @param {string} folderName - Tên thư mục (mặc định là ID người dùng)
   * @param {string} parentFolderId - ID thư mục cha (nếu có)
   * @returns {Promise<string>} - ID thư mục được tạo
   */
  async createUserFolder(userId, folderName = null, parentFolderId = null) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      // Normalize userId - remove special characters
      const normalizedUserId = userId.toString().replace(/[^\w-]/g, "_");
      
      // Use a simple naming convention for folders
      const actualFolderName = folderName || `user_${normalizedUserId}`;
      
      // Check if folder exists by listing all folders and filtering
      const folderList = await this.drive.files.list({
        q: `mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name, description)',
        spaces: 'drive',
      });
      
      // Find the folder by matching name and description (if available)
      let existingFolder = null;
      if (folderList.data.files && folderList.data.files.length > 0) {
        for (const folder of folderList.data.files) {
          if (folder.name === actualFolderName) {
            // If there's a description with user ID, check that too
            if (!folder.description || 
                folder.description.includes(`user_id:${normalizedUserId}`)) {
              existingFolder = folder;
              break;
            }
          }
        }
      }
      
      if (existingFolder) {
        logger.info(`Found existing folder for user ${normalizedUserId}: ${existingFolder.id}`);
        return existingFolder.id;
      }

      // Tạo thư mục mới nếu chưa tồn tại
      const folderMetadata = {
        name: actualFolderName,
        mimeType: 'application/vnd.google-apps.folder',
        // Thêm thông tin người dùng vào mô tả để phân biệt thư mục giữa các user
        description: `OCR user folder - user_id:${normalizedUserId}`
      };

      // Nếu có parentFolderId, thì đặt thư mục con vào thư mục cha
      // Ưu tiên sử dụng tham số parentFolderId, nếu không có thì sử dụng ID từ .env
      if (parentFolderId) {
        folderMetadata.parents = [parentFolderId];
      } else if (this.parentFolderId) {
        folderMetadata.parents = [this.parentFolderId];
      }

      const response = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      logger.info(`Created folder for user ${normalizedUserId} with folder ID: ${response.data.id}`);
      return response.data.id;
    } catch (error) {
      logger.error(`Error creating folder for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Tìm thư mục theo tên và người dùng
   * @param {string} folderName - Tên thư mục cần tìm
   * @param {string} userId - ID người dùng (để tìm thư mục riêng)
   * @returns {Promise<Object|null>} - Thông tin thư mục hoặc null nếu không tìm thấy
   */
  async findFolderByName(folderName, userId = null) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      // Tạo query cơ bản để tìm thư mục theo tên
      let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}'`;
      
      // Nếu có userId, thêm điều kiện để tìm chính xác thư mục của user
      if (userId && userId !== 'public-user') {
        // Thêm tìm kiếm theo metadata (dựa vào mô tả hoặc properties)
        query += ` and description contains 'user_id:${userId}'`;
      }
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, description)',
        spaces: 'drive',
      });

      const files = response.data.files;
      if (files && files.length > 0) {
        // Nếu có userId, đảm bảo chỉ trả về thư mục thuộc về user đó
        if (userId && userId !== 'public-user') {
          for (const file of files) {
            if (file.description && file.description.includes(`user_id:${userId}`)) {
              return file;
            }
          }
          // Không tìm thấy thư mục phù hợp với userId
          return null;
        }
        // Trường hợp không có userId hoặc là 'public-user', trả về thư mục đầu tiên
        return files[0];
      } else {
        return null;
      }
    } catch (error) {
      logger.error(`Error finding folder ${folderName}:`, error);
      throw error;
    }
  }

  /**
   * Upload file lên Google Drive
   * @param {string} filePath - Đường dẫn đến file cần upload
   * @param {string} fileName - Tên file trên Drive
   * @param {string} folderId - ID thư mục chứa file
   * @param {string} mimeType - Kiểu MIME của file
   * @returns {Promise<Object>} - Thông tin file đã upload
   */
  async uploadFile(filePath, fileName, folderId, mimeType) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      // Verify file exists before attempting upload
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }
      
      logger.info(`Preparing to upload file: ${fileName} to folder: ${folderId}`);
      
      // Normalize the fileName to avoid issues
      const safeFileName = fileName.replace(/[^\w\s.-]/g, '_');
      
      const fileMetadata = {
        name: safeFileName,
        parents: [folderId],
      };

      // Create read stream with error handling
      const fileStream = fs.createReadStream(filePath);
      
      // Set up error handling for the stream
      fileStream.on('error', (err) => {
        logger.error(`Error reading file ${filePath} for upload:`, err);
      });

      const media = {
        mimeType: mimeType || 'application/octet-stream',
        body: fileStream,
      };

      logger.info(`Starting upload for ${safeFileName}...`);
      
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id, webViewLink, name',
        supportsAllDrives: true,
      });

      logger.info(`Uploaded file ${safeFileName} to folder ${folderId} with file ID: ${response.data.id}`);
      return {
        id: response.data.id,
        name: response.data.name || safeFileName,
        webViewLink: response.data.webViewLink,
      };
    } catch (error) {
      logger.error(`Error uploading file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Lấy link chia sẻ của file
   * @param {string} fileId - ID của file trên Drive
   * @returns {Promise<string>} - Link chia sẻ
   */
  async getFileShareLink(fileId) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      // Thiết lập quyền truy cập cho file
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      // Lấy thông tin file
      const response = await this.drive.files.get({
        fileId,
        fields: 'webViewLink',
      });

      return response.data.webViewLink;
    } catch (error) {
      logger.error(`Error getting share link for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Xóa file trên Drive
   * @param {string} fileId - ID của file cần xóa
   * @returns {Promise<boolean>} - true nếu xóa thành công
   */
  async deleteFile(fileId) {
    if (!this.initialized) {
      throw new Error('Google Drive service not initialized');
    }

    try {
      await this.drive.files.delete({
        fileId,
      });
      
      logger.info(`Deleted file ${fileId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting file ${fileId}:`, error);
      throw error;
    }
  }
}

const driveService = new GoogleDriveService();
module.exports = driveService; 