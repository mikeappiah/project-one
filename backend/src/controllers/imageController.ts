import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
	PutObjectCommand,
	ListObjectsV2Command,
	DeleteObjectCommand
} from '@aws-sdk/client-s3';
import s3Client from '../config/s3Config.js';

export const uploadImage = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		if (!req.file) {
			res.status(400).json({ error: 'No file provided' });
			return;
		}

		const originalName = req.file.originalname;
		const fileExtension = originalName.split('.').pop();
		const fileName = `${uuidv4()}.${fileExtension}`;

		const command = new PutObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET_NAME!,
			Key: fileName,
			Body: req.file.buffer,
			ContentType: req.file.mimetype
		});

		await s3Client.send(command);

		res.json({
			status: 'success',
			name: fileName,
			url: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${fileName}`
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ status: 'fail', error: 'File upload failed' });
	}
};

export const getImages = async (
	_req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	const bucketName = process.env.AWS_S3_BUCKET_NAME!;

	try {
		const command = new ListObjectsV2Command({
			Bucket: process.env.AWS_S3_BUCKET_NAME!
		});

		const data = await s3Client.send(command);

		if (!data.Contents) {
			res.status(200).json({
				status: 'success',
				data: [],
				results: 0
			});
			return;
		}

		const imageExtensions = [
			'.jpg',
			'.jpeg',
			'.png',
			'.gif',
			'.bmp',
			'.webp',
			'.svg'
		];

		const imageUrls = data.Contents.filter((file) =>
			imageExtensions.some((ext) => file.Key?.toLowerCase().endsWith(ext))
		).map((file) => ({
			id: uuidv4(),
			name: file.Key,
			size: file.Size,
			url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
			lastModified: file.LastModified
		}));

		res.status(200).json({
			status: 'success',
			data: imageUrls,
			results: imageUrls.length
		});
	} catch (error) {
		console.error(error);
		res
			.status(500)
			.json({ status: 'fail', error: 'Failed to fetch S3 objects' });
	}
};

export const deleteImage = async (
	req: Request,
	res: Response,
	_next: NextFunction
): Promise<void> => {
	try {
		const { key } = req.params;

		if (!key) {
			res.status(400).json({ error: 'Image key is required' });
			return;
		}

		const command = new DeleteObjectCommand({
			Bucket: process.env.AWS_S3_BUCKET_NAME!,
			Key: key
		});

		await s3Client.send(command);

		res.status(200).json({
			status: 'success',
			message: `Image ${key} deleted successfully`
		});
	} catch (error) {
		console.error('Error deleting image:', error);
		res.status(500).json({
			status: 'fail',
			error: 'Failed to delete image'
		});
	}
};
