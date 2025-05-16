const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Document = require('../models/Document');
const logger = require('../utils/logger');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for hardcoded admin credentials
    if (email === 'admin@admin.com' && password === 'admin') {
      // Create a JWT token for hardcoded admin without database check
      const token = jwt.sign(
        { 
          id: 'admin-hardcoded-id', 
          username: 'admin', 
          isAdmin: true 
        },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      // Return admin info and token without database check
      return res.json({
        _id: 'admin-hardcoded-id',
        username: 'admin',
        email: 'admin@admin.com',
        isAdmin: true,
        token,
      });
    }

    // For non-hardcoded credentials, follow the regular flow
    // Check if email is in correct format
    if (!email) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Find admin user or create if it doesn't exist
    let adminUser = await User.findOne({ email });

    if (!adminUser) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    } else {
      // Verify this is actually an admin account
      if (!adminUser.isAdmin) {
        return res.status(401).json({ message: 'Not authorized as admin' });
      }

      // Check password
      const isMatch = await adminUser.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: adminUser._id, username: adminUser.username, isAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return admin info and token
    res.json({
      _id: adminUser._id,
      username: adminUser.username,
      email: adminUser.email,
      isAdmin: adminUser.isAdmin,
      token,
    });
  } catch (error) {
    logger.error(`Error in admin login: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all users (admin only)
const getUsers = async (req, res) => {
  try {
    // Add pagination to prevent resource exhaustion
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Add optional filters
    const filter = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { username: searchRegex },
        { email: searchRegex }
      ];
    }
    
    // Optimize query with lean() for better performance
    const usersPromise = User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
      
    // Run count query in parallel with main query for better performance
    const totalPromise = User.countDocuments(filter);
    
    // Execute both promises in parallel
    const [users, total] = await Promise.all([usersPromise, totalPromise]);

    res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Error getting users: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Update user (admin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, isVerified, isAdmin } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (isAdmin !== undefined) user.isAdmin = isAdmin;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      isVerified: updatedUser.isVerified,
      isAdmin: updatedUser.isAdmin,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    logger.error(`Error updating user: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete user (admin only)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();
    res.json({ message: 'User removed' });
  } catch (error) {
    logger.error(`Error deleting user: ${error.message}`);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get all documents (admin only)
const getAllDocuments = async (req, res) => {
  try {
    // Add pagination to prevent resource exhaustion
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Add optional filters
    const filter = {};
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { originalName: searchRegex },
        { type: searchRegex }
      ];
    }
    
    // Use aggregate to properly handle user data from both userId and user fields
    const documentsPromise = Document.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $addFields: {
          user: {
            $cond: {
              if: { $eq: [{ $size: '$userInfo' }, 0] },
              then: null,
              else: { $arrayElemAt: ['$userInfo', 0] }
            }
          }
        }
      },
      {
        $project: {
          userInfo: 0,
          'user.password': 0
        }
      }
    ]);
    
    // Run count query in parallel for better performance
    const totalPromise = Document.countDocuments(filter);
    
    // Execute both promises in parallel
    const [documents, total] = await Promise.all([documentsPromise, totalPromise]);
    
    // Format user data for consistency
    const processedDocuments = documents.map(doc => {
      if (doc.user) {
        // Extract only needed user fields to reduce payload size
        doc.user = {
          _id: doc.user._id,
          username: doc.user.username,
          email: doc.user.email
        };
      }
      return doc;
    });
    
    res.json({
      documents: processedDocuments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error(`Error getting documents: ${error.message}`);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  adminLogin,
  getUsers,
  updateUser,
  deleteUser,
  getAllDocuments
}; 