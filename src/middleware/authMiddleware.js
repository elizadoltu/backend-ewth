import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Resolve the full path of the public key using path.resolve
const publicKeyPath = path.resolve(process.cwd(), process.env.PUBLIC_KEY_PATH);

if (!fs.existsSync(publicKeyPath)) {
    console.error('Public key file not found:', publicKeyPath);
    process.exit(1); // Exit the application if the file is not found
}

const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

export const authMiddleware = (req, res, next) => {
    // Bearer token
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided' });

    try {
        const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(400).json({ message: 'Invalid token.' });
    }
};
