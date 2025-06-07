const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const IdCard = require('../models/IdCard');
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

// Create or update ID card
router.post('/idcard', protect, upload.fields([
  { name: 'portraitImage', maxCount: 1 },
  { name: 'logoImage', maxCount: 1 },
  { name: 'qrImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get form data
    const {
      _id, // Card ID for updates
      cardNumber,
      fullName,
      dateOfBirth,
      sex,
      nationality,
      placeOfOrigin,
      placeOfResidence,
      dateOfExpiry
    } = req.body;
    
    // Validation
    if (!cardNumber || !fullName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Card number and full name are required' 
      });
    }
    
    // Find existing ID card by ID or create a new one
    let idCard;
    if (_id) {
      idCard = await IdCard.findOne({ _id, user: userId });
      if (!idCard) {
        return res.status(404).json({
          success: false,
          message: 'ID card not found or not authorized'
        });
      }
    }
    
    // Handle file uploads to Google Drive
    const fileUpdates = {};
    
    if (req.files) {
      // Handle portrait image
      if (req.files.portraitImage) {
        const portraitFile = req.files.portraitImage[0];
        
        // If updating, delete old portrait image
        if (idCard && idCard.portraitImage && idCard.portraitImage.driveId) {
          try {
            await driveService.deleteFile(idCard.portraitImage.driveId);
            logger.info(`Deleted old portrait image: ${idCard.portraitImage.driveId}`);
          } catch (error) {
            logger.error(`Error deleting old portrait image: ${error.message}`);
            // Continue with upload even if delete fails
          }
        }
        
        // Upload new portrait
        fileUpdates.portraitImage = await uploadFileToDrive(
          userId,
          portraitFile.path,
          portraitFile.originalname,
          'portrait'
        );
      }
      
      // Handle logo image
      if (req.files.logoImage) {
        const logoFile = req.files.logoImage[0];
        
        // If updating, delete old logo image
        if (idCard && idCard.logoImage && idCard.logoImage.driveId) {
          try {
            await driveService.deleteFile(idCard.logoImage.driveId);
          } catch (error) {
            logger.error(`Error deleting old logo image: ${error.message}`);
          }
        }
        
        // Upload new logo
        fileUpdates.logoImage = await uploadFileToDrive(
          userId,
          logoFile.path,
          logoFile.originalname,
          'logo'
        );
      }
      
      // Handle QR image
      if (req.files.qrImage) {
        const qrFile = req.files.qrImage[0];
        
        // If updating, delete old QR image
        if (idCard && idCard.qrImage && idCard.qrImage.driveId) {
          try {
            await driveService.deleteFile(idCard.qrImage.driveId);
          } catch (error) {
            logger.error(`Error deleting old QR image: ${error.message}`);
          }
        }
        
        // Upload new QR
        fileUpdates.qrImage = await uploadFileToDrive(
          userId,
          qrFile.path,
          qrFile.originalname,
          'qr'
        );
      }
    }
    
    // Prepare data for update/insert
    const idCardData = {
      cardNumber,
      fullName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      sex,
      nationality: nationality || 'Vietnam',
      placeOfOrigin,
      placeOfResidence,
      dateOfExpiry: dateOfExpiry ? new Date(dateOfExpiry) : undefined,
      ...fileUpdates
    };
    
    // Update or create ID card
    if (idCard) {
      // Update existing record
      idCard = await IdCard.findByIdAndUpdate(
        idCard._id,
        idCardData,
        { new: true, runValidators: true }
      );
      
      logger.info(`Updated ID card ${idCard._id} for user: ${userId}`);
      res.status(200).json({
        success: true,
        message: 'ID card updated successfully',
        data: idCard
      });
    } else {
      // Create new record
      idCard = new IdCard({
        user: userId,
        ...idCardData
      });
      
      await idCard.save();
      
      logger.info(`Created new ID card for user: ${userId}`);
      res.status(201).json({
        success: true,
        message: 'ID card created successfully',
        data: idCard
      });
    }
  } catch (error) {
    logger.error(`Error saving ID card: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error saving ID card',
      error: error.message
    });
  }
});

// Get user's ID cards
router.get('/user/idcards', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    logger.info(`[GET /user/idcards] Fetching cards for user ID: ${userId}`);
    
    const idCards = await IdCard.find({ user: userId })
      .sort({ updatedAt: -1 }); // Sort by most recently updated
    
    logger.info(`[GET /user/idcards] Found ${idCards.length} cards for user ID: ${userId}`);
    
    res.status(200).json({
      success: true,
      data: idCards
    });
  } catch (error) {
    logger.error(`[GET /user/idcards] Error fetching user ID cards: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user ID cards',
      error: error.message
    });
  }
});

// Get specific ID card by ID
router.get('/idcard/:id', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const cardId = req.params.id;
    
    const idCard = await IdCard.findOne({ 
      _id: cardId,
      user: userId 
    });
    
    if (!idCard) {
      return res.status(404).json({
        success: false,
        message: 'ID card not found or not authorized'
      });
    }
    
    res.status(200).json({
      success: true,
      data: idCard
    });
  } catch (error) {
    logger.error(`Error fetching ID card by ID: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ID card',
      error: error.message
    });
  }
});

// Get user's default/latest ID card
router.get('/idcard', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get the most recently updated ID card for the user
    const idCard = await IdCard.findOne({ user: userId })
      .sort({ updatedAt: -1 });
    
    if (!idCard) {
      return res.status(404).json({
        success: false,
        message: 'ID card not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: idCard
    });
  } catch (error) {
    logger.error(`Error fetching default ID card: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching ID card',
      error: error.message
    });
  }
});

// Delete ID card by ID
router.delete('/idcard/:id', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const cardId = req.params.id;
    
    // Find ID card
    const idCard = await IdCard.findOne({ 
      _id: cardId,
      user: userId 
    });
    
    if (!idCard) {
      return res.status(404).json({
        success: false,
        message: 'ID card not found or not authorized'
      });
    }
    
    // Delete associated files from Google Drive
    if (idCard.portraitImage && idCard.portraitImage.driveId) {
      try {
        await driveService.deleteFile(idCard.portraitImage.driveId);
        logger.info(`Deleted portrait image: ${idCard.portraitImage.driveId}`);
      } catch (error) {
        logger.error(`Error deleting portrait image: ${error.message}`);
      }
    }
    
    if (idCard.logoImage && idCard.logoImage.driveId) {
      try {
        await driveService.deleteFile(idCard.logoImage.driveId);
        logger.info(`Deleted logo image: ${idCard.logoImage.driveId}`);
      } catch (error) {
        logger.error(`Error deleting logo image: ${error.message}`);
      }
    }
    
    if (idCard.qrImage && idCard.qrImage.driveId) {
      try {
        await driveService.deleteFile(idCard.qrImage.driveId);
        logger.info(`Deleted QR image: ${idCard.qrImage.driveId}`);
      } catch (error) {
        logger.error(`Error deleting QR image: ${error.message}`);
      }
    }
    
    // Delete from database
    await IdCard.findByIdAndDelete(idCard._id);
    
    res.status(200).json({
      success: true,
      message: 'ID card deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting ID card: ${error.message}`, error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting ID card',
      error: error.message
    });
  }
});

module.exports = router; 