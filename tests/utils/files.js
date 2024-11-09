import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'util';

const unlink = promisify(fs.unlink);

const readTestFile = async (type = 1) => {
  let filePath = null;

  switch (type) {
    case 2:
      filePath = path.join(__dirname, '..', 'fixtures', 'testVideo.mp4');
      break;
    case 3:
      filePath = path.join(__dirname, '..', 'fixtures', 'testAudio.mp3');
      break;
    case 1:
    default:
      filePath = path.join(__dirname, '..', 'fixtures', 'testImage.jpg');
      break;
  }

  // Use any image file you have for testing
  return fs.createReadStream(filePath, { highWaterMark: 100 * 1024 * 1024 });
};

const generateTestFile = async () => {
  const filePath = path.join(__dirname, '..', 'fixtures', 'testFile.txt');
  await promisify(fs.writeFile)(filePath, 'Test content');
  return filePath;
};

const deleteTestFile = async (filePath) => {
  await unlink(filePath);
};

export { generateTestFile, readTestFile, deleteTestFile };
