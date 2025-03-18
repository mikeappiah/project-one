import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
	PutObjectCommand,
	ListObjectsV2Command,
	DeleteObjectCommand,
	S3Client
} from '@aws-sdk/client-s3';

import { Readable } from 'stream';

const s3Client = new S3Client({
	region: process.env.AWS_REGION!
});

const bucketName = process.env.AWS_S3_BUCKET_NAME as string;
const region = process.env.AWS_REGION as string;

const bufferToStream = (buffer: Buffer) => {
	const stream = new Readable();
	stream.push(buffer);
	stream.push(null);
	return stream;
};

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get('image') as File | null;

	if (!file) {
		return NextResponse.json({ error: 'No file provided' }, { status: 400 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const fileName = `${uuidv4()}.${file.name.split('.').pop()}`;

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: fileName,
		Body: bufferToStream(buffer),
		ContentType: file.type,
		ContentLength: buffer.length
	});

	try {
		await s3Client.send(command);
		return NextResponse.json({
			status: 'success',
			name: fileName,
			url: `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
	}
}

export async function GET() {
	try {
		const command = new ListObjectsV2Command({ Bucket: bucketName });
		const data = await s3Client.send(command);

		if (!data.Contents) {
			return NextResponse.json({ status: 'success', data: [], results: 0 });
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
		const images = data.Contents.filter((file) =>
			imageExtensions.some((ext) => file.Key?.toLowerCase().endsWith(ext))
		).map((file) => ({
			id: uuidv4(),
			name: file.Key!,
			size: file.Size,
			url: `https://${bucketName}.s3.${region}.amazonaws.com/${file.Key}`,
			lastModified: file.LastModified
		}));

		return NextResponse.json({
			status: 'success',
			data: images,
			results: images.length
		});
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: 'Failed to fetch S3 objects' },
			{ status: 500 }
		);
	}
}

export async function DELETE(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const key = searchParams.get('key');

		if (!key) {
			return NextResponse.json(
				{ error: 'Image key is required' },
				{ status: 400 }
			);
		}

		const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
		await s3Client.send(command);

		return NextResponse.json({
			status: 'success',
			message: `Image ${key} deleted`
		});
	} catch (error) {
		console.error('Error deleting image:', error);
		return NextResponse.json(
			{ error: 'Failed to delete image' },
			{ status: 500 }
		);
	}
}
