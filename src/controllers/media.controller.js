const httpStatus = require('http-status');
const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const mediaService = require('../services/media.service');
const ApiError = require('../utils/ApiError');

const uploadFile = catchAsync(async (req, res) => {
  const mediaFile = await mediaService.uploadFile(req.file, req.user);
  res.status(httpStatus.CREATED).send(mediaFile);
});

const getMediaFile = catchAsync(async (req, res) => {
  const file = await mediaService.getFileByName(req.params.filename);
  if (!file) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }
  const uploadDirectory = mediaService.getUploadsDirectory();
  const filePath = `${uploadDirectory}/${file.fileName}`;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }

  // Set appropriate headers
  res.setHeader('Content-Type', file.fileType);
  res.setHeader('Content-Length', file.fileSize);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

module.exports = {
  uploadFile,
  getMediaFile,
};
