import express from 'express';
// import { getCars, addCar } from './src/cars.js';
import cors from 'cors';
import dotenv from 'dotenv'
import bodyParser from 'body-parser';
import authRoutes from './src/routes/authRoutes.js';
import { connectUserDB } from './src/database/userDatabase.js';
import errorHandler from './src/utils/errorHandler.js';
import userGameProgressTable from './src/database/checkpointDatabase.js';
import createMetadataTables from './src/database/metadataDatabase.js';

dotenv.config();

const app = express();
const PORT = 3333;

connectUserDB();
userGameProgressTable();
createMetadataTables();

app.use(cors({
    origin: ['https://everything-with-the-unknown-app.net', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cross-Origin-Opener-Policy']
}));
app.use(bodyParser.json());
app.use((req, res, next) => {
    const now = new Date();
    console.log(`[${now.toISOString()}] - Connection from IP: ${req.ip} - URL: ${req.originalUrl}`);
    next();
})
app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp'); // Optional, for shared buffers
    next();
  });
  
app.use('/api/auth', authRoutes);
app.use(errorHandler);

// app.get('/cars', getCars);
// app.post('/cars', addCar);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
