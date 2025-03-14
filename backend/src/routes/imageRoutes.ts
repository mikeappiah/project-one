import express from 'express';
import { uploadImage, getImages } from '../controllers/imageController.js';
import uploadMiddleware from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.get('/', getImages);
router.post('/upload', uploadMiddleware, uploadImage);

export default router;
