import crypto from 'node:crypto';

const COOKIE_NAME = 'espa_otp';

function getSecret() {
  return process.env.OTP_SECRET || 'espa_foundation_default_otp_signing_secret_key_2026';
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    cookies[key] = value;
    return cookies;
  }, {});
}

function clearOtpCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
  );
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', valid: false });
  }

  const { email, otp, verificationToken } = req.body || {};
  if (!getSecret()) return res.status(500).json({ error: 'OTP_SECRET is not configured.', valid: false });
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const submittedOtp = String(otp || '').replace(/\D/g, '').trim();

  if (!normalizedEmail || !submittedOtp) {
    return res.status(400).json({
      error: 'Email and verification code are required.',
      valid: false,
    });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const cookie = verificationToken || cookies[COOKIE_NAME];

  if (!cookie) {
    return res.status(400).json({
      error: 'No verification code found or it has expired. Please request a new code.',
      valid: false,
    });
  }

  const separator = cookie.lastIndexOf('.');
  if (separator <= 0) {
    clearOtpCookie(res);
    return res.status(400).json({ error: 'Invalid verification session. Please request a new code.', valid: false });
  }

  const payload = cookie.slice(0, separator);
  const signature = cookie.slice(separator + 1);
  const expectedSignature = sign(payload);

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    clearOtpCookie(res);
    return res.status(400).json({ error: 'Invalid verification session. Please request a new code.', valid: false });
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    clearOtpCookie(res);
    return res.status(400).json({ error: 'Invalid verification session. Please request a new code.', valid: false });
  }

  if (data.email !== normalizedEmail) {
    return res.status(400).json({ error: 'Verification code does not match this email address.', valid: false });
  }

  if (Date.now() > Number(data.expiresAt)) {
    clearOtpCookie(res);
    return res.status(400).json({ error: 'Verification code has expired. Please click Resend Code.', valid: false });
  }

  if (data.otp !== submittedOtp) {
    return res.status(400).json({ error: 'Incorrect verification code. Please check your email and try again.', valid: false });
  }

  clearOtpCookie(res);
  return res.status(200).json({ valid: true, success: true });
}
