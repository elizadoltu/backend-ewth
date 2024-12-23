import express from 'express';
// import { getCars, addCar } from './src/cars.js';
import cors from 'cors';
import dotenv from 'dotenv'
import bodyParser from 'body-parser';
import authRoutes from './src/routes/authRoutes.js';
import { connectUserDB } from './src/database/userDatabase.js';
import errorHandler from './src/utils/errorHandler.js';

dotenv.config();

const app = express();
const PORT = 3333;

connectUserDB();

app.use(cors({
    origin: 'https://everything-with-the-unknown-app.net',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    const now = new Date();
    console.log(`[${now.toISOString()}] - Connection from IP: ${req.ip} - URL: ${req.originalUrl}`);
    next();
})
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// app.get('/cars', getCars);
// app.post('/cars', addCar);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
