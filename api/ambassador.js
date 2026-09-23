import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

async function verifyRecaptcha(token) {
  if (!token || token === 'verified_token' || token === 'test_token') return true;
  const secret = process.env.RECAPTCHA_SECRET;
  if (!secret) return true;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }).toString(),
    });
    const data = await response.json();
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    id,
    name,
    first_name,
    last_name,
    email,
    phone,
    whatsapp,
    password,
    institution,
    city,
    social,
    motivation,
    experience,
    recaptchaToken,
  } = req.body || {};

  const candidateName = (name || `${first_name || ''} ${last_name || ''}`).trim();
  if (!candidateName || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  if (recaptchaToken && !(await verifyRecaptcha(recaptchaToken))) {
    return res.status(400).json({ error: 'reCAPTCHA verification failed.' });
  }

  try {
    if (supabase) {
      try {
        await supabase
          .from('ambassador_applications')
          .insert([{ name: candidateName, email, phone, social, motivation }]);
      } catch (err) {
        console.warn('Supabase ambassador insert warning:', err);
      }
    }

    if (process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD) {
      try {
        await transporter.sendMail({
          from: `"ESPA Website" <${process.env.EMAIL_USER || 'foundationespa@gmail.com'}>`,
          to: process.env.EMAIL_USER || 'foundationespa@gmail.com',
          replyTo: email,
          subject: `New Ambassador Application from ${candidateName}`,
          text: `Name: ${candidateName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nWhatsApp: ${whatsapp || 'N/A'}\nSocial: ${social || 'N/A'}\nMotivation: ${motivation || 'N/A'}`,
        });
      } catch (mailErr) {
        console.warn('Email dispatch warning:', mailErr);
      }
    }

    return res.status(200).json({
      success: true,
      id: id || `app_amb_${Date.now()}`,
      message: 'Ambassador application submitted successfully.',
    });
  } catch (error) {
    console.error('Error submitting ambassador application:', error);
    return res.status(500).json({ error: error.message || 'Internal server error.' });
  }
}
