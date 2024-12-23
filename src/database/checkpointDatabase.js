import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); 

const { Pool } = pkg;

const pool = new Pool({ 
    connectionString: process.env.USERPROGRESS_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

pool.connect() 
    .then(() => console.log('Connected to PostgreSQL database.'))
    .catch(err => console.error('Connection error', err))

const userGameProgressTable = async () => {
    const query = `
    CREATE TABLE IF NOT EXISTS user_game_progress (
        user_id VARCHAR(255) PRIMARY KEY, -- Unique identifier for the user
        game_progress JSONB NOT NULL,    -- JSONB column for game progress
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Record creation timestamp
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Record update timestamp
    );
  `;

    try {
        await pool.query(query);
        console.log('Table "user_game_progress" created successfully');
    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        pool.end();
    }
}

export default userGameProgressTable;