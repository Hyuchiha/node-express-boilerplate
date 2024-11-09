import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import randomstring from 'randomstring';
import httpStatus from 'http-status';
import config from '../config/config';
import ApiError from '../utils/ApiError';

const getStorage = (fieldName, destination) => {
  const uploadDirectory = path.join(__dirname, '..', '..', destination);

  // Ensure that the destination directory exists
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }

  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadDirectory);
    },
    filename(req, file, cb) {
      const extension = path.extname(file.originalname);
      const randomFileName = randomstring.generate(24);
      const timestamp = Date.now();

      cb(null, `${randomFileName}-${timestamp}${extension}`);
    },
  });
};

const handleFileUpload = (fieldName, single = true, destination = config.files.uploadDestination) => {
  const storage = getStorage(fieldName, destination);
  const upload = multer({
    limits: {
      fileSize: 1024 * 1024 * config.files.maxSize, // 200 MB
    },
    fileFilter: (req, file, cb) => {
      const allowedFileTypes = config.files.allowFileTypes.split(',');
      if (allowedFileTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new ApiError(httpStatus.BAD_REQUEST, 'File type is not allowed'));
      }
    },
    storage,
  });

  if (single) {
    return upload.single(fieldName);
  }

  return upload.array(fieldName);
};

export default handleFileUpload;
