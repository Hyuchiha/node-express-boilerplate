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
  const isVideo = this.fileType?.match(/video/i);
  const isAudio = this.fileType?.match(/audio/i);
  const isImage = this.fileType?.match(/image/i);

  if (isImage) {
    return `${config.backendUrl}/v1/media/image/${this.fileName}`;
  }

  if (isVideo || isAudio) {
    return `${config.backendUrl}/v1/media/resource/${this.fileName}`;
  }

  return `${config.backendUrl}/v1/media/file/${this.fileName}`;
});

/**
 * @typedef MediaFile
 */
const MediaFile = mongoose.model('MediaFile', mediaFileSchema);

module.exports = MediaFile;
