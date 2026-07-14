/* global process */
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { verifyAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-bottle-key-123';

// In-memory store for OTPs (For production, use Redis)
const otpStore = new Map();

// Helper to send OTP via Real Gmail or Ethereal fallback
async function sendOTP(email, otp) {
  let transporter;

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS) {
    // ✅ REAL Gmail SMTP
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS, // 16-char App Password
      },
    });

    await transporter.sendMail({
      from: `"Pixivo.in" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your OTP - Bottle Production System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e5e5e7; background: #f9f9fb;">
          <h2 style="color: #007aff; margin-bottom: 8px;">Registration OTP</h2>
          <p style="color: #555; font-size: 15px;">Use the following OTP to complete your company registration:</p>
          <div style="font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #1d1d1f; text-align: center; padding: 24px; background: white; border-radius: 8px; border: 2px dashed #007aff; margin: 24px 0;">${otp}</div>
          <p style="color: #888; font-size: 13px;">⏱ Valid for <strong>10 minutes</strong>. Do not share with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e5e5e7; margin: 24px 0;">
          <p style="color: #aaa; font-size: 11px;">Pixivo.in</p>
        </div>
      `,
    });

    console.log(`✅ Real Gmail OTP sent to ${email}`);
    return null; // No preview URL for real email

  } else {
    // ⚠️ Ethereal fallback (dev/test only)
    console.warn('⚠️  GMAIL_USER not set in .env — falling back to Ethereal test email');
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    let info = await transporter.sendMail({
      from: '"Bottle Pro Systems" <no-reply@bottlepro.com>',
      to: email,
      subject: 'Your Registration OTP',
      html: `<b>Your OTP is: ${otp}</b>`,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('Ethereal Preview URL: %s', previewUrl);
    return previewUrl;
  }
}

// 1. Request OTP
router.post('/request-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const existingCompany = await prisma.company.findUnique({ where: { email } });
  if (existingCompany) return res.status(400).json({ error: "Email already registered" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 min

  // Try to send email, but always return OTP for dev mode
  let previewUrl = null;
  try {
    previewUrl = await sendOTP(email, otp);
  } catch {
    console.log('Email send failed (dev mode), OTP is:', otp);
  }

  console.log(`\n🔑 OTP for ${email}: ${otp}\n`);
  
  // Return OTP directly for development (remove in production)
  res.json({ 
    message: "OTP generated successfully", 
    otp, // Direct OTP shown on screen for development
    previewUrl 
  });
});

// 2. Register Company & Admin
router.post('/register', async (req, res) => {
  const { email, otp, companyName, username, password } = req.body;

  const stored = otpStore.get(email);
  if (!stored || stored.otp !== otp || stored.expiresAt < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const existingUser = await prisma.user.findUnique({ where: { username } });
  if (existingUser) return res.status(400).json({ error: "Username already taken" });

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    // Transaction to create Company and Admin User together
    const newCompany = await prisma.$transaction(async (tx) => {
      const comp = await tx.company.create({
        data: { name: companyName || "My Company", email }
      });
      await tx.user.create({
        data: {
          username,
          passwordHash,
          role: "ADMIN",
          companyId: comp.id
        }
      });
      return comp;
    });

    otpStore.delete(email); // cleanup
    res.json({ message: "Company registered successfully!", companyId: newCompany.id });
  } catch (err) {
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

// 3. Login User (Admin or Employee)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, companyId: user.companyId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

// 4. Create Employee (Admin Only)
router.post('/employees', verifyAuth, requireAdmin, async (req, res) => {
  const { username, password } = req.body;
  const companyId = req.user.companyId;

  const exist = await prisma.user.findUnique({ where: { username } });
  if (exist) return res.status(400).json({ error: "Username already taken" });

  const passwordHash = await bcrypt.hash(password, 10);

  const employee = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: 'EMPLOYEE',
      companyId
    }
  });

  res.json({ message: "Employee setup complete", employeeId: employee.id });
});

export default router;
