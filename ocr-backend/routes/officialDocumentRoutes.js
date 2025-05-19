const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const OfficialDocument = require('../models/OfficialDocument');
const { protect } = require('../middleware/auth');
const logger = require('../utils/logger');
const driveService = require('../services/googleDriveService');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/temp');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter to only accept images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Helper function to handle file upload to Google Drive
const uploadFileToDrive = async (userId, filePath, fileName, fieldName) => {
  try {
    // Create user folder if it doesn't exist
    const folderId = await driveService.createUserFolder(userId);
    
    // Determine mime type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let mimeType = 'image/jpeg'; // Default
    
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    // Upload the file
    const uploadedFile = await driveService.uploadFile(
      filePath,
      `${fieldName}_${userId}_${Date.now()}${ext}`,
      folderId,
      mimeType
    );
    
    // Get shareable link
    const fileUrl = await driveService.getFileShareLink(uploadedFile.id);
    
    // Clean up temp file
    fs.unlinkSync(filePath);
    
    return {
      driveId: uploadedFile.id,
      driveUrl: fileUrl
    };
  } catch (error) {
    logger.error(`Error uploading file to Drive: ${error.message}`, error);
    // Still attempt to clean up temp file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Create or update official document
router.post('/document', protect, upload.fields([
  { name: 'documentImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get form data
    const {
      _id, // Document ID for updates
      officialNumber,
      documentDate,
      fullName,
      content,
      address,
      recipientName
    } = req.body;
    
    // Validation
    if (!officialNumber || !fullName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Official number and dear name are required' 
      });
    }
    
    // Find existing document by ID or create a new one
    let document;
    if (_id) {
      document = await OfficialDocument.findOne({ _id, user: userId });
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found or not authorized'
        });
      }
    }
    
    // Handle file uploads to Google Drive
    const fileUpdates = {};
    
    if (req.files) {
      // Handle document image
      if (req.files.documentImage) {
        const documentFile = req.files.documentImage[0];
        
        // If updating, delete old document image
        if (document && document.documentImage && document.documentImage.driveId) {
          try {
            await driveService.deleteFile(document.documentImage.driveId);
            logger.info(`Deleted old document image: ${document.documentImage.driveId}`);
          } catch (error) {
            logger.error(`Error deleting old document image: ${error.message}`);
            // Continue with upload even if delete fails
          }
        }
        
        // Upload new document image
        fileUpdates.documentImage = await uploadFileToDrive(
          userId,
          documentFile.path,
          documentFile.originalname,
          'document'
        );
      }
    }
    
    // Prepare data for update/insert
    const documentData = {
      officialNumber,
      documentDate: documentDate ? new Date(documentDate) : undefined,
      dearName: fullName,
      content,
      address,
      recipientName,
      ...fileUpdates
    };
    
    // Update or create official document
    if (document) {
      // Update existing record
      document = await OfficialDocument.findByIdAndUpdate(
        document._id,
        documentData,
        { new: true, runValidators: true }
      );
      
      logger.info(`Updated official document ${document._id} for user: ${userId}`);
      res.status(200).json({
        success: true,
        message: 'Official document updated successfully',
        data: document
      });
    } else {
      // Create new record
      document = new OfficialDocument({
        user: userId,
        ...documentData
      });
      
      await document.save();
      
      logger.info(`Created new official document for user: ${userId}`);
      res.status(201).json({
        success: true,
        message: 'Official document created successfully',
        data: document
      });
    }
  } catch (error) {
    logger.error(`Error saving official document: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error saving official document',
      error: error.message
    });
  }
});

// Get user's official documents
router.get('/document', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`[GET /document] Fetching documents for user ID: ${userId}`);
    
    const documents = await OfficialDocument.find({ user: userId })
      .sort({ updatedAt: -1 }); // Sort by most recently updated
    
    logger.info(`[GET /document] Found ${documents.length} documents for user ID: ${userId}`);
    
    res.status(200).json({
      success: true,
      data: documents
    });
  } catch (error) {
    logger.error(`[GET /document] Error fetching user official documents: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching official documents',
      error: error.message
    });
  }
});

// Get specific official document by ID
router.get('/document/:id', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;
    
    const document = await OfficialDocument.findOne({ 
      _id: documentId,
      user: userId 
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Official document not found or not authorized'
      });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    logger.error(`Error fetching official document by ID: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching official document',
      error: error.message
    });
  }
});

// Delete official document by ID
router.delete('/document/:id', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;
    
    // Find official document
    const document = await OfficialDocument.findOne({ 
      _id: documentId,
      user: userId 
    });
    
    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Official document not found or not authorized'
      });
    }
    
    // Delete associated file from Google Drive
    if (document.documentImage && document.documentImage.driveId) {
      try {
        await driveService.deleteFile(document.documentImage.driveId);
        logger.info(`Deleted document image: ${document.documentImage.driveId}`);
      } catch (error) {
        logger.error(`Error deleting document image: ${error.message}`);
      }
    }
    
    // Delete from database
    await OfficialDocument.findByIdAndDelete(document._id);
    
    res.status(200).json({
      success: true,
      message: 'Official document deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting official document: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting official document',
      error: error.message
    });
  }
});

module.exports = router; 