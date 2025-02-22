import fs from 'node:fs';
import path from 'node:path';
import handleFileUpload from '../../../src/middlewares/handleFileUpload';
import config from '../../../src/config/config';

jest.mock('node:fs'); // Mock fs at the top

describe('handleFileUpload middleware', () => {
  const fieldName = 'testField';
  const destination = config.files.uploadDestination;
  const uploadDirectory = path.join(__dirname, '..', '..', '..', destination);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Directory creation', () => {
    it('should create the directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false); // Directory does not exist
      fs.mkdirSync.mockImplementation(() => {}); // Mock directory creation

      handleFileUpload(fieldName);

      expect(fs.existsSync).toHaveBeenCalledWith(uploadDirectory);
      expect(fs.mkdirSync).toHaveBeenCalledWith(uploadDirectory, { recursive: true });
    });

    it('should not create the directory if it already exists', () => {
      fs.existsSync.mockReturnValue(true); // Directory already exists

      handleFileUpload(fieldName);

      expect(fs.existsSync).toHaveBeenCalledWith(uploadDirectory);
      expect(fs.mkdirSync).not.toHaveBeenCalled(); // No directory creation
    });
  });

  describe('Single file upload configuration', () => {
    it('should configure multer to handle single file upload by default', () => {
      const upload = handleFileUpload(fieldName);

      expect(upload).toBeDefined(); // Ensure middleware is returned
      expect(typeof upload).toBe('function'); // Check for multer's single file method
    });
  });

  describe('Multiple file upload configuration', () => {
    it('should configure multer to handle multiple file uploads if `single` is set to `false`', () => {
      const upload = handleFileUpload(fieldName, false); // Set `single` to `false`

      expect(upload).toBeDefined(); // Ensure middleware is returned
      expect(typeof upload).toBe('function'); // Check for multer's array method
    });
  });
});
