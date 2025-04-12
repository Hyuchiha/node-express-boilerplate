import request from 'supertest';
import httpStatus from 'http-status';
import path from 'node:path';
import app from '../../src/app';
import setupTestDB from '../utils/setupTestDB';
import { generateTestFile, readTestFile, deleteTestFile } from '../utils/files';
import { insertUsers, userOne } from '../fixtures/user.fixture';
import { userOneAccessToken } from '../fixtures/token.fixture';
import config from '../../src/config/config';

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
      try {
        await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedImage.fileName));
      } catch (err) {
        // Err
      }
    });

    test('should return 200 and image content if image file exists', async () => {
      await request(app).get(`/v1/media/image/${uploadedImage.fileName}`).expect(httpStatus.OK);
    });

    test('should return 404 if image file does not exist', async () => {
      await request(app).get('/v1/media/image/nonexistentImage.jpg').expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if image file exist in db but no in filesystem', async () => {
      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedImage.fileName));

      await request(app).get(`/v1/media/image/${uploadedImage.fileName}`).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if file is not image type', async () => {
      const file = await readTestFile(2);

      const uploadRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      const fileRes = uploadRes.body;

      await request(app).get(`/v1/media/image/${fileRes.fileName}`).expect(httpStatus.NOT_FOUND);

      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, fileRes.fileName));
    });
  });

  describe('GET /v1/media/resource/:filename', () => {
    let uploadedVideo;
    beforeEach(async () => {
      const file = await readTestFile(2);
      await insertUsers([userOne]);

      const uploadRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      uploadedVideo = uploadRes.body;
    });

    afterEach(async () => {
      try {
        await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedVideo.fileName));
      } catch (err) {
        // Err
      }
    });

    test('should return 200 and video content if video file exists', async () => {
      await request(app).get(`/v1/media/resource/${uploadedVideo.fileName}`).expect(httpStatus.OK);
    });

    test('should return 200 and audio content if audio file exists', async () => {
      const fileAudio = await readTestFile(3);

      const uploadAudioRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', fileAudio)
        .expect(httpStatus.CREATED);

      const uploadedAudio = uploadAudioRes.body;

      await request(app).get(`/v1/media/resource/${uploadedAudio.fileName}`).expect(httpStatus.OK);
      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedAudio.fileName));
    });

    test('should return 206 and a video or audio chunk if range is provided', async () => {
      const rangeHeader = 'bytes=0-1023';

      const response = await request(app)
        .get(`/v1/media/resource/${uploadedVideo.fileName}`)
        .set('Range', rangeHeader)
        .expect(httpStatus.PARTIAL_CONTENT);

      expect(response.headers['content-range']).toBe(`bytes 0-1023/${uploadedVideo.fileSize}`);
      expect(response.headers['accept-ranges']).toBe('bytes');
      expect(response.headers['content-type']).toContain('video'); // or 'audio' depending on your test file
      expect(response.body).toBeDefined(); // Ensure data was sent back in the response
    });


    test('should parse range with start and end correctly', async () => {
      const start = 0;
      const end = 99;

      const res = await request(app)
        .get(`/v1/media/resource/${uploadedVideo.fileName}`)
        .set('Range', `bytes=${start}-${end}`)
        .expect(httpStatus.PARTIAL_CONTENT);

      expect(res.status).toBe(206);
      expect(res.headers['content-range']).toBe(`bytes ${start}-${end}/${uploadedVideo.fileSize}`);
    });

    test('should parse range with only start and default end to fileSize - 1', async () => {
      const start = 100;

      const res = await request(app)
        .get(`/v1/media/resource/${uploadedVideo.fileName}`)
        .set('Range', `bytes=${start}-`)
        .expect(httpStatus.PARTIAL_CONTENT);

      const expectedEnd = uploadedVideo.fileSize - 1;
      expect(res.status).toBe(206);
      expect(res.headers['content-range']).toBe(`bytes ${start}-${expectedEnd}/${uploadedVideo.fileSize}`);
    });

    test('should return 404 if audio or video file does not exist', async () => {
      await request(app).get('/v1/media/resource/nonexistentVideo.mp4').expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if audio or video file exist in db but no in filesystem', async () => {
      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedVideo.fileName));

      await request(app).get(`/v1/media/resource/${uploadedVideo.fileName}`).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if file is not video or audio type', async () => {
      const file = await readTestFile();

      const uploadRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      const fileRes = uploadRes.body;

      await request(app).get(`/v1/media/resource/${fileRes.fileName}`).expect(httpStatus.NOT_FOUND);

      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, fileRes.fileName));
    });
  });

  describe('GET /v1/media/file/:filename', () => {
    let uploadedFile;
    beforeEach(async () => {
      const file = await readTestFile(4);
      await insertUsers([userOne]);

      const uploadRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      uploadedFile = uploadRes.body;
    });

    afterEach(async () => {
      try {
        await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedFile.fileName));
      } catch (err) {
        // Err
      }
    });

    test('should return 200 and file content if file file exists', async () => {
      await request(app).get(`/v1/media/file/${uploadedFile.fileName}`).expect(httpStatus.OK);
    });

    test('should return 404 if file does not exist', async () => {
      await request(app).get('/v1/media/file/nonexistentFile.csv').expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if file exist in db but no in filesystem', async () => {
      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, uploadedFile.fileName));

      await request(app).get(`/v1/media/file/${uploadedFile.fileName}`).expect(httpStatus.NOT_FOUND);
    });

    test('should return 404 if file is image, video or audio type', async () => {
      const file = await readTestFile();

      const uploadRes = await request(app)
        .post('/v1/media/upload-file')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .attach('file', file)
        .expect(httpStatus.CREATED);

      const fileRes = uploadRes.body;

      await request(app).get(`/v1/media/file/${fileRes.fileName}`).expect(httpStatus.NOT_FOUND);

      await deleteTestFile(path.join(__dirname, '../..', config.files.uploadDestination, fileRes.fileName));
    });
  })
});
