/**
 * Email configuration using Nodemailer
 * Handles email verification and password reset emails
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Default config (for development/testing)
const defaultConfig: EmailConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport(defaultConfig);
};

// Email options interface
interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Send email function
export const sendEmail = async (options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'REST API'}" <${process.env.EMAIL_FROM || 'noreply@example.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // For development - return preview URL if using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || undefined,
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Send verification email
export const sendVerificationEmail = async (email: string, username: string, token: string): Promise<{ success: boolean; previewUrl?: string }> => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 Verify Your Email</h1>
        </div>
        <div class="content">
          <h2>Hello, ${username}!</h2>
          <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" class="button">Verify Email Address</a>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} REST API. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const result = await sendEmail({
    to: email,
    subject: 'Verify Your Email Address',
    html,
    text: `Hello ${username}! Please verify your email by visiting: ${verificationUrl}`,
  });
  
  return {
    success: result.success,
    previewUrl: result.previewUrl,
  };
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, username: string, token: string): Promise<{ success: boolean; previewUrl?: string }> => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Your Password</h1>
        </div>
        <div class="content">
          <h2>Hello, ${username}!</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} REST API. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const result = await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html,
    text: `Hello ${username}! Reset your password by visiting: ${resetUrl}`,
  });
  
  return {
    success: result.success,
    previewUrl: result.previewUrl,
  };
};

// Send welcome email after verification
export const sendWelcomeEmail = async (email: string, username: string): Promise<{ success: boolean }> => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .feature { padding: 10px 0; border-bottom: 1px solid #eee; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to REST API!</h1>
        </div>
        <div class="content">
          <h2>Hello, ${username}!</h2>
          <p>Your email has been verified successfully. Welcome aboard!</p>
          <div class="features">
            <h3>🚀 What you can do now:</h3>
            <div class="feature">✅ Create and manage posts</div>
            <div class="feature">✅ Upload images and avatars</div>
            <div class="feature">✅ Get real-time notifications</div>
            <div class="feature">✅ Access the full API</div>
          </div>
          <p>Check out our <a href="/api-docs">API Documentation</a> to get started!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} REST API. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const result = await sendEmail({
    to: email,
    subject: 'Welcome to REST API!',
    html,
    text: `Hello ${username}! Welcome to REST API! Your email has been verified.`,
  });
  
  return { success: result.success };
};
