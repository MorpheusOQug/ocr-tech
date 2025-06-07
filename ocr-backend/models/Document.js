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

const Document = mongoose.model('Document', documentSchema);

module.exports = Document; 