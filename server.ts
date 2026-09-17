import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust first proxy to fix express-rate-limit issues
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;

// Security Middleware: Helmet for secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false,
}));

// Security Middleware: Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 form submissions per 15 minutes
  message: { error: 'Too many requests, please try again later.' }
});

app.use(express.json());

// Nodemailer & reCAPTCHA Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'foundationespa@gmail.com',
    pass: 'xzxp ilzw hiwu sjcr',
  },
});

const RECAPTCHA_SECRET = '6LfwCZYtAAAAAE8SIlpjwy7rLKMSekesYdxK9asA';

async function verifyRecaptcha(token: string) {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// API Routes
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;
export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' as any });
  }
  return stripeClient;
}

app.post('/api/create-checkout-session', apiLimiter, async (req, res) => {
  try {
    const stripe = getStripe();
    const { amount } = req.body; // Expected amount in dollars/euros etc.

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'ESPA Foundation Donation',
              description: 'Thank you for supporting our mission.',
            },
            unit_amount: Math.round(Number(amount) * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:3000'}/donate?success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:3000'}/donate?canceled=true`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
});

app.post('/api/contact', apiLimiter, async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;
  if (!name || !email || !message || !recaptchaToken) return res.status(400).json({ error: 'All fields are required' });
  
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message }]);
      if (dbError) console.error('Supabase error (contact):', dbError);
    }

    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
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
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/volunteer', apiLimiter, async (req, res) => {
  const { name, email, area_of_interest, availability, recaptchaToken } = req.body;
  if (!name || !email || !area_of_interest || !availability || !recaptchaToken) return res.status(400).json({ error: 'All fields are required' });
  
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('volunteer_applications')
        .insert([{ name, email, area_of_interest, availability }]);
      if (dbError) console.error('Supabase error (volunteer):', dbError);
    }

    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Volunteer Application from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nArea of Interest: ${area_of_interest}\nAvailability: ${availability}`,
      html: `
        <div style="font-family: 'Poppins'; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #004B36; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Volunteer Application</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;"><strong>Name:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;"><strong>Email:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;"><a href="mailto:${email}" style="color: #004B36;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;"><strong>Area of Interest:</strong></td>
                <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee;">${area_of_interest}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0;"><strong>Availability:</strong></td>
                <td style="padding: 12px 0;">${availability}</td>
              </tr>
            </table>
          </div>
          <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            This email was automatically generated from the ESPA Foundation Website.
          </div>
        </div>
      `
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/partner', apiLimiter, async (req, res) => {
  const { name, organization, email, proposal, recaptchaToken } = req.body;
  if (!name || !organization || !email || !proposal || !recaptchaToken) return res.status(400).json({ error: 'All fields are required' });
  
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('partner_proposals')
        .insert([{ organization, name, email, proposal }]);
      if (dbError) console.error('Supabase error (partner):', dbError);
    }

    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Partnership Proposal from ${organization}`,
      text: `Name: ${name}\nOrganization: ${organization}\nEmail: ${email}\n\nProposal:\n${proposal}`,
      html: `
        <div style="font-family: 'Poppins'; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #004B36; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Partnership Proposal</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Organization:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${organization}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Contact Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Email:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="mailto:${email}" style="color: #004B36;">${email}</a></td>
              </tr>
            </table>
            <div style="padding: 15px; background-color: #ffffff; border-left: 4px solid #004B36; border-radius: 4px;">
              <h4 style="margin-top: 0; color: #333; margin-bottom: 10px;">Proposal Details:</h4>
              <p style="white-space: pre-wrap; margin: 0; color: #555; line-height: 1.5;">${proposal}</p>
            </div>
          </div>
          <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            This email was automatically generated from the ESPA Foundation Website.
          </div>
        </div>
      `
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/ambassador', apiLimiter, async (req, res) => {
  const { name, email, phone, social, motivation, recaptchaToken } = req.body;
  if (!name || !email || !phone || !social || !motivation || !recaptchaToken) return res.status(400).json({ error: 'All fields are required' });
  
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('ambassador_applications')
        .insert([{ name, email, phone, social, motivation }]);
      if (dbError) console.error('Supabase error (ambassador):', dbError);
    }

    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Ambassador Application from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nSocial Media: ${social}\n\nMotivation:\n${motivation}`,
      html: `
        <div style="font-family: 'Poppins'; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #004B36; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Ambassador Application</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Email:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="mailto:${email}" style="color: #004B36;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Phone:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Social Media:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="${social}" target="_blank" style="color: #004B36;">${social}</a></td>
              </tr>
            </table>
            <div style="background-color: white; padding: 15px; border-radius: 6px; border: 1px solid #eeeeee;">
              <h4 style="margin-top: 0; color: #004B36;">Motivation</h4>
              <p style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #333;">${motivation}</p>
            </div>
          </div>
          <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            This email was automatically generated from the ESPA Foundation Website.
          </div>
        </div>
      `
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Election Endpoint
app.post('/api/election', apiLimiter, async (req, res) => {
  const { 
    voterName, 
    president, 
    vicePresident, 
    generalSecretary, 
    jointSecretary, 
    treasurer, 
    executiveMember1, 
    executiveMember2 
  } = req.body;

  try {
    if (supabase) {
      const votes = [
        { voter_name: voterName, title: 'President', nominee_name: president },
        { voter_name: voterName, title: 'Vice President', nominee_name: vicePresident },
        { voter_name: voterName, title: 'General Secretary', nominee_name: generalSecretary },
        { voter_name: voterName, title: 'Joint Secretary', nominee_name: jointSecretary },
        { voter_name: voterName, title: 'Treasurer', nominee_name: treasurer },
        { voter_name: voterName, title: 'Executive Member 1', nominee_name: executiveMember1 },
        { voter_name: voterName, title: 'Executive Member 2', nominee_name: executiveMember2 }
      ];
      
      const { error: dbError } = await supabase
        .from('election_votes')
        .insert(votes);
      if (dbError) {
        console.error('Supabase error (election):', dbError);
        return res.status(500).json({ error: 'Database error: ' + dbError.message });
      }
    } else {
      return res.status(500).json({ error: 'Supabase credentials missing on server' });
    }

    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      subject: `New Election Ballot Submitted by ${voterName}`,
      text: `Voter Name: ${voterName}\n\nPresident: ${president}\nVice President: ${vicePresident}\nGeneral Secretary: ${generalSecretary}\nJoint Secretary: ${jointSecretary}\nTreasurer: ${treasurer}\nExecutive Member 1: ${executiveMember1}\nExecutive Member 2: ${executiveMember2}`,
      html: `
        <h3>New Election Ballot</h3>
        <p><strong>Voter Name:</strong> ${voterName}</p>
        <hr />
        <p><strong>President:</strong> ${president}</p>
        <p><strong>Vice President:</strong> ${vicePresident}</p>
        <p><strong>General Secretary:</strong> ${generalSecretary}</p>
        <p><strong>Joint Secretary:</strong> ${jointSecretary}</p>
        <p><strong>Treasurer:</strong> ${treasurer}</p>
        <p><strong>Executive Member 1:</strong> ${executiveMember1}</p>
        <p><strong>Executive Member 2:</strong> ${executiveMember2}</p>
      `
    });

    res.json({ success: true, message: 'Votes submitted successfully' });
  } catch (error) {
    console.error('Election error:', error);
    res.status(500).json({ error: 'Failed to process votes' });
  }
});

app.post('/api/login', loginLimiter, (req, res) => {
  const { email, password } = req.body;

  // Extremely basic validation, relying on Zod/Yup on frontend as well
  if (!email || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  // Check against environment variables
  const validEmail = process.env.ADMIN_EMAIL || 'admin';
  const validPassword = process.env.ADMIN_PASSWORD || '12345'; // Fallback for dev only

  if (email === validEmail && password === validPassword) {
    // In a real app, generate JWT here
    return res.json({
      success: true,
      user: {
        email: validEmail,
        name: 'Admin User',
        role: 'admin'
      },
      token: 'mock-jwt-token'
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});


app.post('/api/send-otp', apiLimiter, async (req, res) => {
  const { email, otp, recaptchaToken } = req.body;
  
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });
  
  // Verify recaptcha if provided
  if (recaptchaToken) {
    const isValid = await verifyRecaptcha(recaptchaToken);
    if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });
  }

  try {
    transporter.sendMail({
      from: '"ESPA Library" <foundationespa@gmail.com>',
      to: email,
      subject: `Your Library Verification Code: ${otp}`,
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: 'Poppins'; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #004B36; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">Verification Code</h2>
          </div>
          <div style="padding: 30px; background-color: #f9f9f9; text-align: center;">
            <p style="color: #333; margin-bottom: 20px;">Use the following code to verify your account:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #004B36; padding: 15px; background: white; border-radius: 8px; display: inline-block; border: 1px dashed #004B36;">
              ${otp}
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">This code will expire in 10 minutes.</p>
          </div>
        </div>
      `
    });
    console.log(`Successfully sent OTP to ${email}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

// Serve static files


import https from 'https';
import http from 'http';

app.get('/api/proxy-pdf', (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send('URL required');
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  const httpClient = url.startsWith('https') ? https : http;
  
  const makeRequest = (targetUrl: string, cookie: string = '') => {
    const options = cookie ? { headers: { Cookie: cookie } } : {};
    httpClient.get(targetUrl, options, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        if (response.headers.location) {
          // Pass along cookies if provided by Google Drive
          let nextCookie = cookie;
          if (response.headers['set-cookie']) {
            nextCookie = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
          }
          return makeRequest(response.headers.location, nextCookie);
        }
      }
      
      // If it's a 4xx or 5xx
      if (response.statusCode && response.statusCode >= 400) {
        return res.status(response.statusCode).send('Failed to fetch PDF');
      }
      
      // Google Drive virus scan bypass
      if (targetUrl.includes('drive.google.com') && response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          const confirmMatch = body.match(/confirm=([a-zA-Z0-9_-]+)/);
          if (confirmMatch) {
            const confirmToken = confirmMatch[1];
            const newUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'confirm=' + confirmToken;
            let nextCookie = cookie;
            if (response.headers['set-cookie']) {
              nextCookie = response.headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
            }
            makeRequest(newUrl, nextCookie);
          } else {
             // Not a virus scan page, or unable to find token
             res.status(500).send('Unable to bypass Google Drive virus scan');
          }
        });
        return;
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      response.pipe(res);
    }).on('error', (e) => {
      res.status(500).send('Error proxying request');
    });
  };
  
  makeRequest(url);
});

// Serve static files in production
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
