import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { login, logout, register, googleLogin, googleRegister, verifyEmail, googleCallback } from '../controllers/authController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register);
router.get('/admin', [authMiddleware, roleMiddleware(['admin'])], (req, res) => {
    res.json({ message: 'Welcome, admin!' });
});
router.post('/verify-email', verifyEmail);

router.get('/auth/google', (req, res) => {
    const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['profile', 'email'],
    });

    res.redirect(authUrl);
});

router.get('/auth/google/callback', googleCallback);

router.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: `Hello ${req.user.username}, you have access to this route!` });
});

export default router;
