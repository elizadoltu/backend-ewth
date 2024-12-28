import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { login, logout, register, googleLogin, googleRegister, verifiyEmail } from '../controllers/authController.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/logout', logout);
router.post('/register', register);
router.get('/admin', [authMiddleware, roleMiddleware(['admin'])], (req, res) => {
    res.json({ message: 'Welcome, admin!' });
});
router.post('/verify-email', verifiyEmail);

router.get('/google/login', googleLogin);
router.get('/google/register', googleRegister);

router.get('/protected', authMiddleware, (req, res) => {
    res.json({ message: `Hello ${req.user.username}, you have access to this route!` });
});

export default router;
