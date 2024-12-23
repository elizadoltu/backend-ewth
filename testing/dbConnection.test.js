import { beforeAll, afterAll, expect, test } from 'vitest';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.USERPROGRESS_URL,
    ssl: { rejectUnauthorized: false },
});

beforeAll(async () => {
    await pool.connect();
});

afterAll(async () => {
    await pool.end();
});

test('should connect to PostgreSQL database', async () => {
    const res = await pool.query('SELECT NOW()');
    expect(res.rows[0].now).toBeDefined();
});
