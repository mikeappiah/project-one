import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import imageRouter from './routes/imageRoutes.js';

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors({ origin: 'http://localhost:5173' }));

app.use('/api/images', imageRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
