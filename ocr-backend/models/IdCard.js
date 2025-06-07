const mongoose = require('mongoose');

const idCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardNumber: {
    type: String,
    required: true,
    trim: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  sex: {
    type: String,
    trim: true
  },
  nationality: {
    type: String,
    default: 'Vietnam',
    trim: true
  },
  placeOfOrigin: {
    type: String,
    trim: true
  },
  placeOfResidence: {
    type: String,
    trim: true
  },
  dateOfExpiry: {
    type: Date
  },
  // Google Drive file references
  portraitImage: {
    driveId: String,
    driveUrl: String
  },
  logoImage: {
    driveId: String,
    driveUrl: String
  },
  qrImage: {
    driveId: String,
    driveUrl: String
  },
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically maintain createdAt and updatedAt fields
});

// Create index for faster lookups
idCardSchema.index({ cardNumber: 1 });

const IdCard = mongoose.model('IdCard', idCardSchema);

module.exports = IdCard; 