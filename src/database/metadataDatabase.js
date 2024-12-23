import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.METADATA_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.connect()
    .then(() => console.log('Connected to PostgreSQL Metadata database'))
    .catch(err => console.error('Connection error', err));

const submissionsTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS submissions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255),
        feedback TEXT,
        submission_date TIMESTAMP DEFAULT NOW()
    );
    `;

    try {
        await pool.query(query);
        console.log('Table "submissions" created successfully');
    } catch (err) {
        console.error('Error creating table:', err);
    }
};

const htmlFilesTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS htmlFiles (
        id SERIAL PRIMARY KEY,
        submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
        html_file_url TEXT
    );
    `;

    try {
        await pool.query(query);
        console.log('Table "htmlFiles" created successfully');
    } catch (err) {
        console.error('Error creating table', err);
    }
};

const cssFiles = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS cssFiles (
        id SERIAL PRIMARY KEY,
        submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
        css_file_url TEXT
    );
    `;

    try {
        await pool.query(query);
        console.log('Table "cssFiles" created successfully');
    } catch (err) {
        console.error('Error creating table', err);
    }
};

const jsFiles = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS jsFiles (
        id SERIAL PRIMARY KEY,
        submission_id INT REFERENCES submissions(id) ON DELETE CASCADE,
        js_file_url TEXT
    );
    `;

    try {
        await pool.query(query);
        console.log('Table "jsFiles" created successfully');
    } catch (err) {
        console.error('Error creating table', err);
    }
};

const createMetadataTables = async () => {
    await submissionsTable();
    await htmlFilesTable();
    await cssFiles();
    await jsFiles();

    pool.end(); 
};

export default createMetadataTables;
