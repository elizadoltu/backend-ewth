// cars.js
import { client } from './dbconnect.js';

const db = client.db('test');  
const collection = db.collection('cars'); 

export const getCars = async (req, res) => {
    try {
        const cars = await collection.find().toArray();
        res.json(cars);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

export const addCar = async (req, res) => {
    try {
        const car = req.body;
        const result = await collection.insertOne(car);
        if (result.acknowledged) {
            res.status(201).json(car);
        } else {
            res.status(500).json({ error: "Failed to add the car" });
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
};
