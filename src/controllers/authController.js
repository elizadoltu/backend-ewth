import jwt from 'jsonwebtoken';
import fs from 'fs';
import model from '../models/User.js';
import tokenModel from '../models/RefreshToken.js';
import dotenv from 'dotenv';
import { account, OAuthProvider } from '../utils/client.js';

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
        expiresIn: new Date(Dtae.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await refreshToken.save();
    return token;
};

export const googleLogin = async (req, res) => {
    try {
        const session = await account.createOAuth2Session(OAuthProvider.Google);
    } catch (error) {
        res.status(500).json({ message: 'Google Login failed', error });
    }
};

export const googleCallback = async (req, res) => {
    try {
        const userDetails = await account.get();
        let user = await model.findOne({ email: userDetails.email });

        if (!user) {
            user = new model({
                username: userDetails.name,
                email: userDetails.email
            });
            await user.save();
        }

        const payload = { id: user._id, username: user.username };
        const accessToken = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: process.env.JWT_EXPIRATION,
        });
        const refreshToken = await generateRefreshToken(user._id);
        res.json({
            message: 'Google login successful',
            user: { username: user.username, email: user.email },
            token: accessToken,
            refreshToken,
        });
    } catch (error) {
        res.status(500).json({ message: 'Google Callback failed', error });
    }
}


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
    const { username, password, email } = req.body;

    try {
        const existingUser = await model.findOne({ username, email });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const user = new model({ username, password, email });
        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.log(error);
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