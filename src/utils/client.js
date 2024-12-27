import { Client, Account, OAuthProvider } from "appwrite";
import dotenv from 'dotenv';

dotenv.config();

const client = new Client();

client 
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID);

const account = new Account(client);

export { account,  OAuthProvider};