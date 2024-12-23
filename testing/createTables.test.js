import { beforeAll, afterAll, expect, test } from 'vitest';
import pkg from 'pg';
import dotenv from 'dotenv';
import userGameProgressTable from '../src/database/checkpointDatabase';
import createMetadataTables from '../src/database/metadataDatabase';

dotenv.config();

const { Pool } = pkg;

const metadataPool = new Pool({
    connectionString: process.env.METADATA_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

const userGameProgressPool = new Pool({
    connectionString: process.env.USERPROGRESS_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

beforeAll(async () => {
    await metadataPool.connect();
    await userGameProgressPool.connect();
});

afterAll(async () => {
    await metadataPool.end();
    await userGameProgressPool.end();
});

test('should create "user_game_progress" table', async () => {
    try {
        await userGameProgressTable();
        const res = await userGameProgressPool.query('SELECT to_regclass($1)', ['user_game_progress']);
        expect(res.rows[0].to_regclass).toBe('user_game_progress'); 
    } catch (error) {
        throw new Error(`Failed to create "user_game_progress" table: ${error.message}`);
    }
});

test('should create "submissions" table', async () => {
    try {
        await createMetadataTables();
        const res = await metadataPool.query('SELECT to_regclass($1)', ['submissions']);
        expect(res.rows[0].to_regclass).toBe('submissions');
    } catch (error) {
        throw new Error(`Failed to create "submissions" table: ${error.message}`);
    }
});

test('should create "htmlFiles" table', async () => {
    try {
        await createMetadataTables();
        const res = await metadataPool.query('SELECT to_regclass($1)', ['htmlFiles']);
        expect(res.rows[0].to_regclass).toBe('htmlFiles'); 
    } catch (error) {
        throw new Error(`Failed to create "htmlFiles" table: ${error.message}`);
    }
});

test('should create "cssFiles" table', async () => {
    try {
        await createMetadataTables();
        const res = await metadataPool.query('SELECT to_regclass($1)', ['cssFiles']);
        expect(res.rows[0].to_regclass).toBe('cssFiles'); 
    } catch (error) {
        throw new Error(`Failed to create "cssFiles" table: ${error.message}`);
    }
});

test('should create "jsFiles" table', async () => {
    try {
        await createMetadataTables();
        const res = await metadataPool.query('SELECT to_regclass($1)', ['jsFiles']);
        expect(res.rows[0].to_regclass).toBe('jsFiles'); 
    } catch (error) {
        throw new Error(`Failed to create "jsFiles" table: ${error.message}`);
    }
});
