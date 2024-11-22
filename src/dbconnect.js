// dbconnect.js
import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export const client = new MongoClient(process.env.CONNECTION_STRING, {
    serverApi: ServerApiVersion.v1,
    ssl: true,
    tls: true,
    retryWrites: true,
    tlsInsecure: false,
});

(async () => {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
})();
