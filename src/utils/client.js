import { Client, Account } from "appwrite";
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();
const account = new Account(client);

client 
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID);

export { client, account };