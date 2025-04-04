'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
	Upload,
	Grid,
	List,
	ChevronLeft,
	ChevronRight,
	Loader2,
	X,
	Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Image {
	id: string;
	name: string;
	url: string;
	size: number;
	lastModified: Date;
}

interface Notification {
	id: string;
	message: string;
	type: 'success' | 'error';
}

export default function Home() {
	const [view, setView] = useState<'grid' | 'list'>('grid');
	const [currentPage, setCurrentPage] = useState(1);
	const [images, setImages] = useState<Image[]>([]);
	const [loading, setLoading] = useState(true);
	const [uploadingFile, setUploadingFile] = useState(false);
	const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [deletingImages, setDeletingImages] = useState<Record<string, boolean>>(
		{}
	);

	useEffect(() => {
		const fetchImages = async () => {
			setLoading(true);
			try {
				const res = await axios.get(`/api/images`);
				const data = res.data?.data;
				setImages(data);
				showNotification('Images fetched successfully', 'success');
			} catch (error) {
				if (error instanceof Error) {
					console.error('Failed to fetch images:', error.message);
				} else {
					console.error('Failed to fetch images:', error);
				}
				showNotification('Failed to load images', 'error');
			} finally {
				setLoading(false);
			}
		};

		fetchImages();
	}, []);

	const showNotification = (message: string, type: 'success' | 'error') => {
		const id = Date.now().toString();
		setNotifications((prev) => [...prev, { id, message, type }]);

		setTimeout(() => {
			setNotifications((prev) =>
				prev.filter((notification) => notification.id !== id)
			);
		}, 5000);
	};

	const dismissNotification = (id: string) => {
		setNotifications((prev) =>
			prev.filter((notification) => notification.id !== id)
		);
	};

	async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;

		const formData = new FormData();
		formData.append('image', file);

		setUploadingFile(true);

		try {
			await axios.post(`/api/images`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			});

			const res = await axios.get(`/api/images`);
			const data = res.data.data;
			setImages(data);

			showNotification(`Successfully uploaded ${file.name}`, 'success');
		} catch (error) {
			console.log('Error uploading image:', error);
			showNotification('Failed to upload image', 'error');
		} finally {
			setUploadingFile(false);
			event.target.value = '';
		}
	}

	const handleDeleteImage = async (image: Image) => {
		if (!image.name) return;

		setDeletingImages((prev) => ({
			...prev,
			[image.id]: true
		}));

		try {
			await axios.delete(`/api/images?key=${image.name}`);

			setImages((prev) => prev.filter((img) => img.id !== image.id));

			showNotification(`Successfully deleted ${image.name}`, 'success');
		} catch (error) {
			console.log('Error deleting image:', error);
			showNotification('Failed to delete image', 'error');
		} finally {
			setDeletingImages((prev) => ({
				...prev,
				[image.id]: false
			}));
		}
	};

	const imagesPerPage = 12;

	const totalPages = Math.ceil(images?.length / imagesPerPage);
	const startIndex = (currentPage - 1) * imagesPerPage;
	const paginatedImages = images?.slice(startIndex, startIndex + imagesPerPage);

	const pageNumbers = [];

	for (let i = 1; i <= totalPages; i++) {
		pageNumbers.push(i);
	}

	const handleImageLoad = (id: string) => {
		setLoadedImages((prev) => ({
			...prev,
			[id]: true
		}));
	};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);

		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	return (
		<div className='container mx-auto py-6 px-4 md:px-6 dark'>
			<div className='fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2 max-w-md'>
				{notifications?.map((notification) => (
					<Alert
						key={notification.id}
						className={`flex justify-between items-start rounded-none ${
							notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
						}`}
					>
						<div>
							<AlertDescription className='text-sm text-white font-medium'>
								{notification.message}
							</AlertDescription>
						</div>
						<Button
							variant='ghost'
							size='sm'
							className='h-6 w-6 p-0 rounded-none'
							onClick={() => dismissNotification(notification.id)}
						>
							<X className='h-4 w-4' />
							<span className='sr-only'>Dismiss</span>
						</Button>
					</Alert>
				))}
			</div>

			<div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4'>
				<div>
					<h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
					<p className='text-muted-foreground mt-1'>
						View your S3 bucket images
					</p>
				</div>

				<div className='flex items-center gap-4'>
					<div className='flex items-center'>
						<Button
							variant={view === 'grid' ? 'default' : 'outline'}
							size='icon'
							onClick={() => setView('grid')}
							className='rounded-r-none'
						>
							<Grid className='h-4 w-4' />
							<span className='sr-only'>Grid view</span>
						</Button>
						<Button
							variant={view === 'list' ? 'default' : 'outline'}
							size='icon'
							onClick={() => setView('list')}
							className='rounded-l-none'
						>
							<List className='h-4 w-4' />
							<span className='sr-only'>List view</span>
						</Button>
					</div>

					<div className='relative'>
						<Input
							type='file'
							id='image'
							className='absolute inset-0 opacity-0 w-full h-full cursor-pointer'
							accept='image/*'
							name='image'
							onChange={handleImageUpload}
							disabled={uploadingFile}
						/>
						{uploadingFile ? (
							<Button variant='outline' className='w-full'>
								<Loader2 className='h-4 w-4 mr-2 animate-spin' />
								Uploading...
							</Button>
						) : (
							<Button
								variant='outline'
								className='w-full'
								disabled={uploadingFile}
							>
								<Upload className='h-4 w-4 mr-2' />
								Upload Image
							</Button>
						)}
					</div>
				</div>
			</div>

			{loading ? (
				view === 'grid' ? (
					<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
						{Array.from({ length: 12 }).map((_, index) => (
							<Card key={index} className='overflow-hidden rounded-none'>
								<div className='aspect-square'>
									<Skeleton className='h-full w-full' />
								</div>
								<CardContent className='p-3'>
									<Skeleton className='h-4 w-3/4 mb-2' />
									<Skeleton className='h-3 w-1/2 mt-3' />
									<Skeleton className='h-3 w-1/3 mt-2' />
								</CardContent>
							</Card>
						))}
					</div>
				) : (
					<div className='border divide-y'>
						{Array.from({ length: 12 }).map((_, index) => (
							<div key={index} className='flex items-center p-3'>
								<Skeleton className='h-12 w-12 mr-4 rounded' />
								<div className='flex-1 min-w-0'>
									<Skeleton className='h-4 w-3/4 mb-2' />
									<Skeleton className='h-3 w-1/2' />
								</div>
								<Skeleton className='h-3 w-16' />
							</div>
						))}
					</div>
				)
			) : (
				<>
					{view === 'grid' ? (
						<div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
							{paginatedImages?.map((image) => (
								<Card key={image.id} className='overflow-hidden rounded-none'>
									<div className='aspect-square relative'>
										{!loadedImages[image.id] && (
											<Skeleton className='absolute inset-0 w-full h-full' />
										)}
										<img
											src={image.url}
											className='object-cover w-full h-full'
											onLoad={() => handleImageLoad(image.id)}
											style={{ opacity: loadedImages[image.id] ? 1 : 0 }}
										/>
									</div>
									<CardContent className='p-3'>
										<div className='flex justify-between items-start'>
											<h2 className='truncate font-medium pr-2'>
												{image.name}
											</h2>
											<Button
												variant='secondary'
												size='sm'
												className='rounded-none h-8 w-8 p-0'
												onClick={() => handleDeleteImage(image)}
												disabled={deletingImages[image.id]}
											>
												{deletingImages[image.id] ? (
													<Loader2 className='h-4 w-4 animate-spin' />
												) : (
													<Trash2 className='h-4 w-4' />
												)}
												<span className='sr-only'>Delete</span>
											</Button>
										</div>
										<div className='text-sm text-muted-foreground mt-3'>
											{new Date(image.lastModified).toLocaleDateString()}
										</div>
										<div className='text-sm font-medium mt-2'>
											{(image.size / 1000).toFixed(1)} KB
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					) : (
						<div className='border divide-y'>
							{paginatedImages?.map((image) => (
								<div
									key={image.id}
									className='flex items-center p-3 hover:bg-muted/50'
								>
									<div className='h-12 w-12 mr-4 overflow-hidden rounded relative'>
										{!loadedImages[image.id] && (
											<Skeleton className='absolute inset-0 w-full h-full' />
										)}
										<img
											src={image.url}
											alt={image.name}
											className='object-cover w-full h-full'
											onLoad={() => handleImageLoad(image.id)}
											style={{ opacity: loadedImages[image.id] ? 1 : 0 }}
										/>
									</div>
									<div className='flex-1 min-w-0'>
										<div className='truncate font-medium'>{image.name}</div>
										<div className='text-xs text-muted-foreground'>
											{new Date(image.lastModified).toLocaleDateString()}
										</div>
									</div>
									<div className='text-sm text-muted-foreground mr-4'>
										{(image.size / 1000).toFixed(1)} KB
									</div>
									<Button
										variant='secondary'
										size='sm'
										className='rounded-none'
										onClick={() => handleDeleteImage(image)}
										disabled={deletingImages[image.id]}
									>
										{deletingImages[image.id] ? (
											<Loader2 className='h-4 w-4 animate-spin' />
										) : (
											<Trash2 className='h-4 w-4' />
										)}
									</Button>
								</div>
							))}
						</div>
					)}

					<div className='flex items-center justify-between mt-8'>
						<div className='text-sm text-muted-foreground'>
							Showing {startIndex + 1}-
							{Math.min(startIndex + imagesPerPage, images?.length)} of{' '}
							{images?.length} images
						</div>
						<div className='flex items-center gap-1'>
							<Button
								variant='outline'
								size='icon'
								className='rounded-none'
								disabled={currentPage === 1}
								onClick={() => handlePageChange(currentPage - 1)}
							>
								<ChevronLeft className='h-4 w-4' />
								<span className='sr-only'>Previous page</span>
							</Button>

							{pageNumbers?.map((page) => (
								<Button
									key={page}
									variant={page === currentPage ? 'default' : 'outline'}
									size='icon'
									onClick={() => handlePageChange(page)}
									className='w-8 h-8 rounded-none'
								>
									{page}
								</Button>
							))}

							<Button
								variant='outline'
								size='icon'
								className='rounded-none'
								disabled={currentPage === totalPages}
								onClick={() => handlePageChange(currentPage + 1)}
							>
								<ChevronRight className='h-4 w-4' />
								<span className='sr-only'>Next page</span>
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
