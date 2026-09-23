import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_UL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { name, email, message, recaptchaToken } = req.body;
  
  try {
    const recaptchaSecret = process.env.RECAPTCHA_SECRET || process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret && recaptchaToken && recaptchaToken !== 'verified_token') {
      const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
      });
      const verifyData = await verifyRes.json();
      
      if (!verifyData.success) {
        return res.status(400).json({ error: 'reCAPTCHA validation failed.' });
      }
    }

    if (supabase) {
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message }]);
      if (dbError) console.error('Supabase error (contact):', dbError);
    }

    await transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Contact from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 20px; background-color: #f3f4f6;">
<div style="font-family: 'Poppins'; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
  
  <!-- Text-Based Logo Header -->
  <div style="background-color: #ffffff; padding: 35px 20px; text-align: center; border-bottom: 1px solid #f3f4f6;">
    <div style="color: #004B36; margin: 0; padding: 0;">
      <div style="font-family: 'Poppins'; font-weight: 700; font-size: 50px; line-height: 1; margin: 0; letter-spacing: -1px;">ESPA</div>
      <div style="font-family: 'Poppins'; font-weight: 400; font-size: 32px; line-height: 1; margin: 0;">Foundation</div>
    </div>
  </div>

  <!-- Content -->
  <div style="padding: 40px 30px;">
    <div style="margin-bottom: 25px;">
      <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Name</p>
      <p style="margin: 0; color: #111827; font-size: 16px; padding: 14px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">${name}</p>
    </div>

    <div style="margin-bottom: 25px;">
      <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Email Address</p>
      <p style="margin: 0; color: #111827; font-size: 16px; padding: 14px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">${email}</p>
    </div>

    <div style="margin-bottom: 20px;">
      <p style="margin: 0 0 6px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Message</p>
      <p style="margin: 0; color: #111827; font-size: 15px; line-height: 1.7; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6; white-space: pre-wrap;">${message}</p>
    </div>
  </div>

  <!-- Green Footer -->
  <div style="background-color: #004B36; padding: 40px 30px; text-align: center; color: #ffffff;">
    
    <!-- Social Icons (Stroke only) -->
    <div style="margin-bottom: 25px;">
      <a href="https://www.linkedin.com/company/espafoundation/" target="_blank" style="display: inline-block; margin: 0 12px; text-decoration: none;">
        <img src="https://img.icons8.com/ios/50/ffffff/linkedin.png" alt="LinkedIn" style="width: 28px; height: 28px; display: block; opacity: 0.9;" />
      </a>
      <a href="https://www.instagram.com/espafoundation/" target="_blank" style="display: inline-block; margin: 0 12px; text-decoration: none;">
        <img src="https://img.icons8.com/ios/50/ffffff/instagram-new.png" alt="Instagram" style="width: 28px; height: 28px; display: block; opacity: 0.9;" />
      </a>
    </div>

    <!-- Divider -->
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.15); margin: 0 auto 25px auto; width: 70%;" />

    <!-- Links -->
    <div style="margin-bottom: 25px;">
      <a href="https://espafoundation.org/privacy" style="color: #ffffff; text-decoration: none; font-size: 13px; margin: 0 15px; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 2px;">Privacy Policy</a>
      <a href="https://espafoundation.org/terms" style="color: #ffffff; text-decoration: none; font-size: 13px; margin: 0 15px; font-weight: 500; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 2px;">Terms of Service</a>
    </div>

    <!-- Copyright -->
    <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 400;">
      &copy; 2026 ESPA Foundation. All Rights Reserved.
    </p>
  </div>
</div>
</body>
</html>
      `
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Email service error: ' + error.message });
  }
}
