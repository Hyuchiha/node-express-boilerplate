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

  const isImage = file?.ffileType?.match(/image/i);

  if (!isImage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }

  // Set appropriate headers
  res.setHeader('Content-Type', file.fileType);
  res.setHeader('Content-Length', file.fileSize);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

const getVideoFile = catchAsync(async (req, res) => {
  const { range } = req.headers;

  const file = await mediaService.getFileByName(req.params.id);
  if (!file) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }
  const uploadDirectory = mediaService.getUploadsDirectory();
  const filePath = `${uploadDirectory}/${file.fileName}`;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }

  const isVideo = file?.fileType?.match(/video/i);
  if (!isVideo) {
    throw new ApiError(httpStatus.NOT_FOUND, 'File not found');
  }

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.fileSize - 1;
    const chunkSize = end - start + 1;
    const streamFile = fs.createReadStream(filePath, { start, end });
    const headers = {
      'Content-Type': file?.fileType,
      'Content-Length': chunkSize,
      'Content-Range': `bytes ${start}-${end}/${file.fileSize}`,
      'Accept-Ranges': 'bytes',
    };
    res.status(httpStatus.PARTIAL_CONTENT).set(headers);
    streamFile.pipe(res);
  } else {
    const headers = {
      'Content-Type': file?.fileType,
      'Content-Length': file.fileSize,
      'Accept-Ranges': 'bytes',
    };
    res.status(httpStatus.OK).set(headers);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
});

module.exports = {
  uploadFile,
  getMediaFile,
  getVideoFile,
};
