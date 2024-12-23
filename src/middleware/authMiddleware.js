import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const publicKey = process.env.PUBLIC_KEY_PATH.replace(/\\n/g, '\n');

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
