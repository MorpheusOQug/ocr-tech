const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Adding user field for backward compatibility
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ocrResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  mode: {
    type: String,
    enum: ['text', 'table', 'form'],
    default: 'text'
  },
  driveId: {
    type: String,
    default: null
  },
  driveUrl: {
    type: String,
    default: null
  },
  driveFolderId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on update
documentSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

// Set user field based on userId for backward compatibility
documentSchema.pre('save', function(next) {
  if (this.userId && !this.user) {
    this.user = this.userId;
  }
  next();
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document; 