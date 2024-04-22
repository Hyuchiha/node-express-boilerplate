const path = require('path');
const fs = require('fs');
const config = require('../config/config');
const { MediaFile } = require('../models');

/**
 * Returns the path where the upload files are stored
 * @return {string}
 */
const getUploadsDirectory = () => {
  return path.join(__dirname, '..', '..', config.files.uploadDestination);
};

/**
 * Creates a new MediaFile with the provided file of multer
 * @param {Object} file
 * @param {User} user
 * @return {Promise<MediaFile>}
 */
const uploadFile = async (file, user) => {
  const { filename, mimetype } = file;

  const stat = fs.statSync(file.path);

  return MediaFile.create({
    fileName: filename,
    fileType: mimetype,
    fileSize: stat.size,
    user: user.id,
  });
};

/**
 * Get MediaFile by FileName
 * @param fileName
 * @return {Promise<MediaFile>}
 */
const getFileByName = async (fileName) => {
  return MediaFile.findOne({ fileName });
};

module.exports = {
  uploadFile,
  getFileByName,
  getUploadsDirectory,
};
