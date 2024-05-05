const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const unlink = promisify(fs.unlink);

const readTestFile = async (isVideo = false) => {
  let filePath = null;

  if (isVideo) {
    filePath = path.join(__dirname, '..', 'fixtures', 'testVideo.mp4');
  } else {
    filePath = path.join(__dirname, '..', 'fixtures', 'testImage.jpg');
  }
  // Use any image file you have for testing
  return fs.createReadStream(filePath);
};

const generateTestFile = async () => {
  const filePath = path.join(__dirname, '..', 'fixtures', 'testFile.txt');
  await promisify(fs.writeFile)(filePath, 'Test content');
  return filePath;
};

const deleteTestFile = async (filePath) => {
  await unlink(filePath);
};

module.exports = {
  generateTestFile,
  readTestFile,
  deleteTestFile,
};
