import jwt from 'jsonwebtoken';
import fs from 'fs';
import model from '../models/User.js';
import tokenModel from '../models/RefreshToken.js';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const privateKey = process.env.PRIVATE_KEY_PATH.replace(/\\n/g, '\n');
const publicKey = process.env.PUBLIC_KEY_PATH.replace(/\\n/g, '\n');

const generateRefreshToken = async (userId) => {
    const token = jwt.sign({}, privateKey, {
        algorithm: 'RS256',
        expiresIn: '7d',
    });

    const refreshToken = new tokenModel({
        token, 
        user: userId,
        expiresIn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await refreshToken.save();
    return token;
};


export const refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) return res.status(400).json({ message: 'Refresh token expired.' });

    try {
        // Find the refresh token in the database
        const refreshToken = await tokenModel.findOne({ token }).populate('user');
        if (!refreshToken || refreshToken.expiresAt < Date.now()) {
            return res.status(401).json({ message: 'Invalid or expired refresh token.' });
        }

        // Generate a new access token
        const payload = { id: refreshToken.user._id, username: refreshToken.user.username, email: refreshToken.user.email };
        const accessToken = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRATION,
        });

        const newRefreshToken = await generateRefreshToken(refreshToken.user._id);
        await tokenModel.findByIdAndDelete(refreshToken._id);

        res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const register = async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const existingUser = await model.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const verificationCode = crypto.randomBytes(20).toString('hex');

        const newUser = new model({
            username, 
            email,
            password,
            verificationCode,
            isVerified: false,
        });
        await newUser.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Email Verification',
            text: `Hello ${username},\n\nPlease use the following code to verify your email address: ${verificationCode}\n\nBest regards,\nEverything With The Unknown`,
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const login = async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const user = await model.findOne({ username, email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Validate password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT 
        const payload = { id: user._id, username: user.username, email: user.email };
        const token = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRATION
        });

        const refreshToken = await generateRefreshToken(user._id);

        res.json({ token, refreshToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const logout = async (req, res) => {
    const { token } = req.body;

    try {
        await tokenModel.findOneAndDelete({ token });
        res.json({ message: 'Logged out successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const googleRegister = async (req, res) => {
    const { username, email } = req.body;
    try {
        const existingUser = await model.findOne({ username, email });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already existis' });
        }

        const user = new model({ username, email });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
}

export const googleLogin = async (req, res) => {
    const { username, email } = req.body;
    try {
        const user = await model.findOne({ username, email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create JWT
        const payload = { id: user._id, username: user.username, email: user.email };
        const token = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRATION
        });

        const refreshToken = await generateRefreshToken(user._id);

        res.json({ token, refreshToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const verifyEmail = async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const user = await model.findOne({ email, verificationCode });
        if (!user) {
            return res.status(400).json({ message: 'Invalid code or email' });
        }

        user.isVerified = true;
        user.verificationCode = null;
        await user.save();

        const payload = { id: user._id, username: user.username, email: user.email };
        const token = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRATION,
        });

        const refreshToken = await generateRefreshToken(user._id);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Account Created Successfully',
            text: `Hello ${user.username},\n\nYour account has been successfully created and verified! You can now log in and start using our services.\n\nThank you for joining us!\n\nBest regards,\nYour Company Name`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'Email verified successfully', token, refreshToken });

    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};