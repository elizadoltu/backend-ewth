import request from 'supertest'
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express'
import cors from 'cors';
import { getCars, addCar } from '../src/cars';

const app = express();
app.use(cors());
app.use(express.json());
app.get('/cars', getCars);
app.post('/cars', addCar);

describe('Cars API', () => {
    let server; 
    
    beforeAll(() => {
        server = app.listen(3333);
    });
    afterAll(() => {
        server.close();
    });

    it('GET /cars should return a list of cars', async() => {
        const res = await request(app).get('/cars');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
    it('POST /cars should add a new car', async() => {
        const newCar = { make: 'Toyota', model: 'Pryus', year: 2021 };
        const res = await request(app).post('/cars').send(newCar);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject(newCar);
    });
});