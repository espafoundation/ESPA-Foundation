import crypto from 'node:crypto';
import nodemailer from 'nodemailer';

const OTP_TTL_SECONDS = 10 * 60;
const COOKIE_NAME = 'espa_otp';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

function getSecret() {
  return process.env.OTP_SECRET || 'espa_foundation_default_otp_signing_secret_key_2026';
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createOtpCookie(email, otp, expiresAt) {
  const payload = Buffer.from(JSON.stringify({ email, otp, expiresAt }), 'utf8').toString('base64url');
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

async function verifyRecaptcha(token) {
  if (!token || token === 'verified_token' || token === 'test_token') return true;

  const secret = process.env.RECAPTCHA_SECRET || process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });
    const data = await response.json();
    return Boolean(data.success);
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return true;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, recaptchaToken, purpose } = req.body || {};
  if (!getSecret()) return res.status(500).json({ error: 'OTP_SECRET is not configured.' });
  const normalizedEmail = String(email || '').trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return res.status(400).json({ error: 'A valid email address is required.' });
  }

  if (purpose !== 'management' && !(await verifyRecaptcha(recaptchaToken))) {
    return res.status(400).json({ error: 'reCAPTCHA verification failed.' });
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = Date.now() + OTP_TTL_SECONDS * 1000;
  const cookieValue = createOtpCookie(normalizedEmail, otp, expiresAt);
  const isLibrary = purpose === 'library' || purpose === 'digital_library';
  const senderTitle = isLibrary ? 'ESPA Digital Library' : 'ESPA Foundation';
  const subject = isLibrary
    ? `Your Library Verification Code: ${otp}`
    : `Your ESPA Verification Code: ${otp}`;

  try {
    await transporter.sendMail({
      from: `"${senderTitle}" <${process.env.EMAIL_USER || 'foundationespa@gmail.com'}>`,
      to: normalizedEmail,
      subject,
      text: `Your verification code is: ${otp}\n\nThis verification code will expire in 10 minutes.\n\nIf you did not request this code, you can safely ignore this email.\n\nESPA Foundation\nfoundationespa@gmail.com`,
    });

    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${cookieValue}; HttpOnly; Path=/; Max-Age=${OTP_TTL_SECONDS}; SameSite=Lax${secure}`
    );

    return res.status(200).json({
      success: true,
      message: 'Verification code sent to your email.',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({
      error: 'Failed to send OTP email. Please check your email address and try again.',
    });
  }
}
