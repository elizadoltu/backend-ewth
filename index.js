import express from 'express';
import { getCars, addCar } from './src/cars.js';
import cors from 'cors';

const app = express();
const PORT = 3333;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    const now = new Date();
    console.log(`[${now.toISOString()}] - Connection from IP: ${req.ip} - URL: ${req.originalUrl}`);
    next();
})

app.get('/cars', getCars);
app.post('/cars', addCar);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
