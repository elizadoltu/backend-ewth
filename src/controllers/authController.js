import jwt from "jsonwebtoken";
import fs from "fs";
import model from "../models/User.js";
import tokenModel from "../models/RefreshToken.js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import fetch from "node-fetch";

dotenv.config();

const privateKey = process.env.PRIVATE_KEY_PATH.replace(/\\n/g, "\n");
const publicKey = process.env.PUBLIC_KEY_PATH.replace(/\\n/g, "\n");

const generateRefreshToken = async (userId) => {
  const token = jwt.sign({}, privateKey, {
    algorithm: "RS256",
    expiresIn: "7d",
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

  if (!token)
    return res.status(400).json({ message: "Refresh token expired." });

  try {
    // Find the refresh token in the database
    const refreshToken = await tokenModel.findOne({ token }).populate("user");
    if (!refreshToken || refreshToken.expiresAt < Date.now()) {
      return res
        .status(401)
        .json({ message: "Invalid or expired refresh token." });
    }

    // Generate a new access token
    const payload = {
      id: refreshToken.user._id,
      username: refreshToken.user.username,
      email: refreshToken.user.email,
    };
    const accessToken = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: process.env.JWT_EXPIRATION,
    });

    const newRefreshToken = await generateRefreshToken(refreshToken.user._id);
    await tokenModel.findByIdAndDelete(refreshToken._id);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await model.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const newUser = new model({
      username,
      email,
      password,
      verificationCode,
      isVerified: false,
    });
    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "Everything With The Unknown",
      to: email,
      subject: "Email Verification",
      text: `Hello ${username},\n\nPlease use the following code to verify your email address: ${verificationCode}\n\nBest regards,\nEverything With The Unknown`,
      html: `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    h1 {
                        color: #0056b3;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    .footer {
                        font-size: 14px;
                        color: #999;
                        margin-top: 20px;
                    }
                    .cta {
                        display: inline-block;
                        background-color: #28a745;
                        color: white;
                        padding: 10px 20px;
                        font-size: 16px;
                        border-radius: 5px;
                        text-decoration: none;
                        margin-top: 20px;
                    }
                    a {
                        color: #007bff;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Hi, ${username}!</h1>
                    <p>Your verification code is: <strong>${verificationCode}</strong></p>
                    <p>Enter this code on our website to activate your account.</p>
                    <p>If you have any questions, don't hesitate to <a href="mailto:everythingwithunknowninfo@gmail.com">contact us</a>.</p>
                    <p class="footer">Best regards,<br>Everything With The Unknown</p>
                </div>
            </body>
        </html>
    `,
    };

    await transporter.sendMail(mailOptions);

    res
      .status(201)
      .json({
        message:
          "Registration successful! Please check your email to verify your account.",
      });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const login = async (req, res) => {
  const { username, password, email } = req.body;

  try {
    const user = await model.findOne({ username, email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: process.env.JWT_EXPIRATION,
    });

    const refreshToken = await generateRefreshToken(user._id);

    res.json({ token, refreshToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const logout = async (req, res) => {
  const { token } = req.body;

  try {
    await tokenModel.findOneAndDelete({ token });
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const googleRegister = async (req, res) => {
  const { username, email } = req.body;
  try {
    const existingUser = await model.findOne({ username, email });
    if (existingUser) {
      return res.status(400).json({ message: "Username already existis" });
    }

    const user = new model({ username, email });
    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const googleCallback = async (req, res) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
res.setHeader('Access-Control-Allow-Origin', 'https://everything-with-the-unknown-app.net');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cross-Origin-Opener-Policy');

try {
  // Get the authorization code from the frontend
  const code = req.headers.authorization;
  console.log('Authorization Code:', code);

  // Exchange the authorization code for an access token
  const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: 'postmessage',
          grant_type: 'authorization_code'
      }
  );

  const accessToken = response.data.access_token;
  const idToken = response.data.id_token;

  if (!idToken) {
      return res.status(400).json({ message: 'Failed to retrieve ID token' });
  }

  console.log('Access Token:', accessToken);

  // Verify and decode the ID token to get user details
  const ticket = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
          headers: {
              Authorization: `Bearer ${accessToken}`
          }
      }
  );

  const userDetails = ticket.data;
  const { email, name } = userDetails;
  console.log('User Details:', userDetails);

  // Check if user exists in the database or create a new one
  let user = await model.findOne({ email });

  if (!user) {
      user = new model({ email, username: name });
      await user.save();
      console.log('User registered:', user);
  } else {
      console.log('User logged in:', user);
  }

  // Generate JWT token
  const payload = {
      id: user._id,
      username: user.username,
      email: user.email
  };

  const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: process.env.JWT_EXPIRATION
  });

  // Generate refresh token
  const refreshToken = await generateRefreshToken(user._id);

  res.status(200).json({
      message: 'Authentication successful',
      token,
      refreshToken
  });
} catch (error) {
  console.error('Error during authentication:', error);
  res.status(500).json({ message: 'Authentication failed' });
}
};

export const googleLogin = async (req, res) => {
  const { username, email } = req.body;
  try {
    const user = await model.findOne({ username, email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create JWT
    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: process.env.JWT_EXPIRATION,
    });

    const refreshToken = await generateRefreshToken(user._id);

    res.json({ token, refreshToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", error });
  }
};

export const verifyEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  try {
    const user = await model.findOne({ email, verificationCode });
    if (!user) {
      return res.status(400).json({ message: "Invalid code or email" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    await user.save();

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    const token = jwt.sign(payload, privateKey, {
      algorithm: "RS256",
      expiresIn: process.env.JWT_EXPIRATION,
    });

    const refreshToken = await generateRefreshToken(user._id);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: "Everything With The Unknown",
      to: email,
      subject: "Account Created Successfully",
      text: `Hello ${user.username},\n\nYour account has been successfully created and verified! You can now log in and start using our services.\n\nThank you for joining us!\n\nBest regards,\nEverything With The Unknown`,
      html: `
        <html>
            <head>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        color: #333;
                        margin: 0;
                        padding: 0;
                        background-color: #f4f4f4;
                    }
                    .container {
                        width: 100%;
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        padding: 20px;
                        border-radius: 8px;
                    }
                    h1 {
                        color: #0056b3;
                        font-size: 24px;
                        margin-bottom: 10px;
                    }
                    p {
                        font-size: 16px;
                        line-height: 1.6;
                    }
                    .footer {
                        font-size: 14px;
                        color: #999;
                        margin-top: 20px;
                    }
                    .cta {
                        display: inline-block;
                        background-color: #007bff;
                        color: white;
                        padding: 10px 20px;
                        font-size: 16px;
                        border-radius: 5px;
                        text-decoration: none;
                        margin-top: 20px;
                    }
                    a {
                        color: #007bff;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Hello ${user.username},</h1>
                    <p>Your account has been successfully created and verified!</p>
                    <p>You can now log in and start using our services.</p>
                    <p>Thank you for joining us!</p>
                    <p class="footer">Best regards,<br>Everything With The Unknown</p>
                </div>
            </body>
        </html>
    `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Email verified successfully", token, refreshToken });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
};
