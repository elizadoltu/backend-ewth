import { beforeAll, afterAll, expect, test } from 'vitest';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.METADATA_URL,
    ssl: { rejectUnauthorized: false },
});

beforeAll(async () => {
    await pool.connect();
});

afterAll(async () => {
    await pool.end();
});

test('should insert a submission', async () => {
    const query = `
        INSERT INTO submissions (user_id, feedback) 
        VALUES ('user_123', 'Good job!')
        RETURNING id, user_id, feedback;
    `;
    const res = await pool.query(query);
    expect(res.rows[0].user_id).toBe('user_123');
    expect(res.rows[0].feedback).toBe('Good job!');
});

test('should insert an html file entry', async () => {
    const query = `
        INSERT INTO htmlFiles (submission_id, html_file_url) 
        VALUES (1, 'http://example.com/file.html') 
        RETURNING id, submission_id, html_file_url;
    `;
    const res = await pool.query(query);
    expect(res.rows[0].html_file_url).toBe('http://example.com/file.html');
});

test('should insert a css file entry', async () => {
    const query = `
        INSERT INTO cssFiles (submission_id, css_file_url) 
        VALUES (1, 'http://example.com/style.css') 
        RETURNING id, submission_id, css_file_url;
    `;
    const res = await pool.query(query);
    expect(res.rows[0].css_file_url).toBe('http://example.com/style.css');
});

test('should insert a js file entry', async () => {
    const query = `
        INSERT INTO jsFiles (submission_id, js_file_url) 
        VALUES (1, 'http://example.com/script.js') 
        RETURNING id, submission_id, js_file_url;
    `;
    const res = await pool.query(query);
    expect(res.rows[0].js_file_url).toBe('http://example.com/script.js');
});
