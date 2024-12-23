// import { MongoClient, ServerApiVersion } from 'mongodb';
// import dotenv from 'dotenv';

// dotenv.config();

// const client = new MongoClient(process.env.CONNECTION_STRING, {
//     serverApi: ServerApiVersion.v1,
//     ssl: true,
//     tls: true,
//     retryWrites: true,
//     tlsInsecure: false,
// });

// export const connectUserDB = async () => {
//     try {
//       await client.connect();
//       console.log("Connected to MongoDB");
//     } catch (err) {
//       console.error("MongoDB connection error:", err);
//       process.exit(1); 
//     }
//   };

import mongoose from 'mongoose';
import { ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

export const connectUserDB = async () => {
  try {
    await mongoose.connect(process.env.CONNECTION_STRING, {
      dbName: 'users',  
      serverApi: ServerApiVersion.v1,
      ssl: true,
      tls: true,
      retryWrites: true,
      tlsInsecure: false,
    });
    console.log("Connected to MongoDB using Mongoose");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};
