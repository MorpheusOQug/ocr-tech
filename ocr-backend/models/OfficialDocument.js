const mongoose = require('mongoose');

const officialDocumentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  officialNumber: {
    type: String,
    required: true,
    trim: true
  },
  documentDate: {
    type: Date
  },
  dearName: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  recipientName: {
    type: String,
    trim: true
  },
  // Google Drive file references
  documentImage: {
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
officialDocumentSchema.index({ officialNumber: 1 });

const OfficialDocument = mongoose.model('OfficialDocument', officialDocumentSchema);

module.exports = OfficialDocument; 