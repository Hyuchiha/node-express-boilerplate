const express = require('express');
const handleFileUpload = require('../../middlewares/handleFileUpload');
const validate = require('../../middlewares/validate');
const auth = require('../../middlewares/auth');
const mediaController = require('../../controllers/media.controller');
const mediaValidation = require('../../validations/media.validation');

const router = express.Router();

router.post('/upload-file', auth(), handleFileUpload('file'), mediaController.uploadFile);
router.get('/file/:filename', validate(mediaValidation.getMediaFile), mediaController.getMediaFile);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Mediafiles upload and consult
 */

/**
 * @swagger
 * /media/upload-file:
 *   post:
 *     summary: Upload a file to the server
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       "201":
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fileName:
 *                   type: string
 *                 fileType:
 *                   type: string
 *                 fileSize:
 *                   type: integer
 *                 user:
 *                   type: string
 *                 url:
 *                   type: string
 *                 id:
 *                   type: string
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /media/file/{filename}:
 *   get:
 *     summary: Obtain a file by its name
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: File name
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
