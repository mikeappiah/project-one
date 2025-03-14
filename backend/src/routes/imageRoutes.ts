import express from 'express';
import {
	uploadImage,
	getImages,
	deleteImage
} from '../controllers/imageController.js';
import uploadMiddleware from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.route('/').get(getImages).post(uploadMiddleware, uploadImage);

router.delete('/:key', deleteImage);
export default router;
