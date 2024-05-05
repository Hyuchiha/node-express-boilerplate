const request = require('supertest');
const httpStatus = require('http-status');
const path = require('path');
const app = require('../../src/app');
const setupTestDB = require('../utils/setupTestDB');
const { generateTestFile, readTestFile, deleteTestFile } = require('../utils/files');
const { insertUsers, userOne } = require('../fixtures/user.fixture');
const { userOneAccessToken } = require('../fixtures/token.fixture');
const config = require('../../src/config/config');

setupTestDB();

describe('Media routes', () => {
  describe('POST /v1/media/upload-file', () => {
    let file;
    beforeAll(async () => {
      file = await readTestFile();
    });

    test('should return 201 and upload file successfully', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('fileName');
      expect(res.body).toHaveProperty('fileType');
      expect(res.body).toHaveProperty('fileSize');
      expect(res.body).toHaveProperty('url');
      expect(res.body).toHaveProperty('id');

      expect(res.body.url).toMatch(/^http(s)?:\/\/.+/);

      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, res.body.fileName));
    });

    test('should return 401 if user is not authenticated', async () => {
      await request(app).post('/v1/media/upload-file').attach('file', file).expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if file is not allowed', async () => {
      const filePath = await generateTestFile();

      await insertUsers([userOne]);

      await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', filePath)
        .expect(httpStatus.BAD_REQUEST);

      await deleteTestFile(filePath);
    });
  });

  describe('GET /v1/media/image/:filename', () => {
    let uploadedImage;
    beforeEach(async () => {
      const file = await readTestFile();
      await insertUsers([userOne]);

      const uploadRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      uploadedImage = uploadRes.body;
    });

    afterEach(async () => {
      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedImage.fileName));
    });

    test('should return 200 and image content if image file exists', async () => {
      await request(app).get(`/v1/media/image/${uploadedImage.fileName}`).expect(httpStatus.OK);
    });

    test('should return 404 if image file does not exist', async () => {
      await request(app).get('/v1/media/image/nonexistentImage.jpg').expect(httpStatus.NOT_FOUND);
    });
  });

  describe.skip('GET /v1/media/video/:filename', () => {
    let uploadedVideo;
    beforeEach(async () => {
      const file = await readTestFile();
      await insertUsers([userOne]);

      const uploadRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      uploadedVideo = uploadRes.body;
    });

    afterEach(async () => {
      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedVideo.fileName));
    });

    test('should return 200 and video content if video file exists', async () => {
      await request(app).get(`/v1/media/video/${uploadedVideo.fileName}`).expect(httpStatus.OK);
    });

    test('should return 404 if video file does not exist', async () => {
      await request(app).get('/v1/media/video/nonexistentVideo.mp4').expect(httpStatus.NOT_FOUND);
    });
  });
});
