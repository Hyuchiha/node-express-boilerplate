const mongoose = require('mongoose');
const { toJSON } = require('./plugins');
const config = require('../config/config');

const mediaFileSchema = mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
      default: '',
    },
    fileType: {
      type: String,
      required: true,
      default: '',
    },
    fileSize: {
      type: Number,
      required: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
mediaFileSchema.plugin(toJSON);

mediaFileSchema.virtual('url').get(function () {
  return `${config.backendUrl}v1/media/file/${this.fileName}`;
});

/**
 * @typedef MediaFile
 */
const MediaFile = mongoose.model('MediaFile', mediaFileSchema);

module.exports = MediaFile;
