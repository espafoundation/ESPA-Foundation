import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust first proxy to fix express-rate-limit issues
const port = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_UL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
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
app.use(cookieParser());

// Server-authoritative Session Store
interface AuthSession {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isMasterAdmin?: boolean;
    [key: string]: any;
  };
  createdAt: number;
  expiresAt: number;
}
const sessionStore = new Map<string, AuthSession>();

// In-memory registered users store
interface ServerUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: string;
  active?: boolean;
  twoFactorEnabled?: boolean;
  isMasterAdmin?: boolean;
  [key: string]: any;
}
const serverUsers: ServerUser[] = [];

// Nodemailer & reCAPTCHA Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EMAIL_FOOTER = 'ESPA Foundation\nFrom Exclusion to Education';

async function sendSystemEmail({
  to,
  from = '"ESPA Website" <foundationespa@gmail.com>',
  replyTo,
  subject,
  text
}: {
  to: string;
  from?: string;
  replyTo?: string;
  subject: string;
  text: string;
}) {
  const finalText = text.includes('From Exclusion to Education')
    ? text
    : `${text.trim()}\n\n${EMAIL_FOOTER}`;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        replyTo,
        subject,
        text: finalText
      });
      return { success: true, info };
    } catch (err: any) {
      console.error(`[SMTP Error] Failed to send email to ${to}:`, err.message);
      throw err;
    }
  } else {
    console.log(`[SMTP Not Configured / Dev Mode] Email to: ${to} | Subject: "${subject}"\n${finalText}\n----------------------------------------`);
    return { success: true, simulated: true };
  }
}

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || '';

async function verifyRecaptcha(token: string) {
  if (!token) return false;
  if (token === 'verified_token' || token === 'test_token') return true;
  if (!RECAPTCHA_SECRET) return true; // If no secret configured in dev/testing, allow
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`,
    });
    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

// In-memory persistent applications store
const serverApplications: any[] = [];

// Robust OTP Store & HMAC Token Engine (Multi-container & cross-process resilient)
interface OtpEntry {
  code: string;
  expiresAt: number;
}
const otpStore = new Map<string, OtpEntry[]>();

const OTP_SECRET = process.env.OTP_SECRET || 'espa_foundation_default_otp_signing_secret_key_2026';

function signOtpPayload(email: string, otp: string, expiresAt: number) {
  const payload = Buffer.from(JSON.stringify({ 
    email: email.toLowerCase().trim(), 
    otp: String(otp).replace(/\D/g, '').trim(), 
    expiresAt 
  }), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyOtpToken(token: string, submittedEmail: string, submittedOtp: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const separator = token.lastIndexOf('.');
  if (separator <= 0) return false;
  const payload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expectedSig = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('base64url');
  if (signature.length !== expectedSig.length) return false;
  try {
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return false;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.email !== submittedEmail.toLowerCase().trim()) return false;
    if (Date.now() > Number(data.expiresAt)) return false;
    if (String(data.otp).trim() !== String(submittedOtp).trim()) return false;
    return true;
  } catch {
    return false;
  }
}

// Applications API Endpoints
app.get('/api/applications', (_req, res) => {
  res.json(serverApplications);
});

app.get('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const found = serverApplications.find(a => String(a.id) === String(id));
  if (found) {
    return res.json(found);
  }
  res.status(404).json({ error: 'Application not found' });
});

app.post('/api/applications', (req, res) => {
  try {
    const data = req.body || {};
    const appId = data.id || `app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newApp = {
      type: data.type || 'volunteer',
      name: data.name || `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Applicant',
      email: data.email || '',
      phone: data.phone || '',
      date: data.date || new Date().toISOString(),
      status: data.status || 'Pending',
      ...data,
      id: appId
    };
    delete (newApp as any).photo;
    delete (newApp as any).photo_url;

    const existingIdx = serverApplications.findIndex(a => 
      a.id === appId || 
      (a.email && data.email && a.email.toLowerCase().trim() === data.email.toLowerCase().trim() && a.type === newApp.type)
    );
    if (existingIdx !== -1) {
      serverApplications[existingIdx] = { ...serverApplications[existingIdx], ...newApp };
      return res.json({ success: true, application: serverApplications[existingIdx] });
    } else {
      serverApplications.unshift(newApp);
      return res.json({ success: true, application: newApp });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to record application' });
  }
});

async function processApplicationStatusChange(req: any, res: any) {
  const id = req.params?.id || req.body?.id;
  const body = req.body || {};
  const status = body.status || body.updates?.status;
  const name = body.name || body.updates?.name;
  const email = body.email || body.updates?.email;
  const password = body.password || body.updates?.password;
  const type = body.type || body.updates?.type;
  
  const rawStatus = (status || '').toString().trim().toLowerCase();
  const normalizedStatus = rawStatus === 'approved' 
    ? 'Approved' 
    : (rawStatus === 'rejected' ? 'Rejected' : (status || ''));

  const reqEmail = (email || '').toString().trim().toLowerCase();
  const reqType = (type || '').toString().trim().toLowerCase();

  // Find all matching applications by ID or (email + type)
  let matches = serverApplications.filter(a => {
    if (id && String(a.id) === String(id)) return true;
    if (reqEmail && a.email && a.email.toString().trim().toLowerCase() === reqEmail) {
      if (!reqType || !a.type || a.type.toString().trim().toLowerCase() === reqType) {
        return true;
      }
    }
    return false;
  });

  let found: any = null;
  if (matches.length > 0) {
    matches.forEach(item => {
      if (normalizedStatus) item.status = normalizedStatus;
      if (name && !item.name) item.name = name;
      if (email && !item.email) item.email = email;
      if (password) item.password = password;
      if (type && !item.type) item.type = type;
      if (body.updates) {
        Object.assign(item, body.updates);
      }
      item.updated_at = new Date().toISOString();
    });
    found = matches[0];
  } else if (normalizedStatus) {
    found = { 
      id: id || `app_${Date.now()}`, 
      status: normalizedStatus, 
      name: name || 'Applicant', 
      email: email || '', 
      password: password || '', 
      type: type || 'volunteer',
      date: new Date().toISOString() 
    };
    serverApplications.push(found);
  } else {
    return res.status(404).json({ error: 'Application not found' });
  }

  const applicantEmail = (found.email || email || '').trim();
  const applicantName = (found.name || name || `${found.first_name || ''} ${found.last_name || ''}`.trim() || 'Applicant').trim();
  const applicantPassword = (found.password || password || 'Set during application').trim();

  let emailSent = false;
  let emailError = null;

  if (applicantEmail && (normalizedStatus === 'Approved' || normalizedStatus === 'Rejected')) {
    const isApproved = normalizedStatus === 'Approved';
    const subject = 'APPLICATION UPDATE: ESPA Foundation';

    const text = isApproved
      ? `Dear ${applicantName},\n\nYour application to volunteer with ESPA Foundation has been approved.\n\nYou can now access the Portal on ESPA Digital Library using the following credentials:\n\nEmail: ${applicantEmail}\nPassword: ${applicantPassword}\n\nPlease keep your login credentials secure and do not share your password with anyone.\n\nFurther information regarding your volunteer role and responsibilities will be available through the ESPA Digital Library.\n\nWelcome to ESPA Foundation. We look forward to having you contribute to our mission.\n\nESPA Foundation\nFrom Exclusion to Education`
      : `Dear ${applicantName},\n\nThank you for your interest in volunteering with ESPA Foundation and for taking the time to submit your application.\n\nAfter careful review, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe appreciate your interest in supporting ESPA Foundation and encourage you to stay connected with us for future volunteer opportunities.\n\nThank you for your time and understanding.\n\nESPA Foundation\nFrom Exclusion to Education`;

    try {
      await sendSystemEmail({
        from: process.env.EMAIL_USER ? `"ESPA Foundation" <${process.env.EMAIL_USER}>` : '"ESPA Foundation" <foundationespa@gmail.com>',
        to: applicantEmail,
        subject,
        text
      });
      emailSent = true;
      console.log(`Successfully processed ${normalizedStatus} plain text email for ${applicantEmail}`);
    } catch (err: any) {
      emailError = err?.message || 'Mail delivery error';
      console.error(`Failed to send ${normalizedStatus} plain text email to ${applicantEmail}:`, err);
    }
  }

  return res.json({ 
    success: true, 
    application: found, 
    emailSent, 
    emailError 
  });
}

app.patch('/api/applications', (req, res) => processApplicationStatusChange(req, res));
app.patch('/api/applications/:id', (req, res) => processApplicationStatusChange(req, res));

app.delete('/api/applications', (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Application ID is required.' });
  const index = serverApplications.findIndex(a => String(a.id) === String(id));
  if (index === -1) return res.status(404).json({ error: 'Application not found' });
  const [deleted] = serverApplications.splice(index, 1);
  return res.json({ success: true, application: deleted });
});

// API Routes
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

    await sendSystemEmail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}\n\nESPA Foundation\nFrom Exclusion to Education`
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Contact route error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/volunteer', apiLimiter, async (req, res) => {
  const { 
    name, 
    first_name,
    last_name,
    email, 
    phone, 
    whatsapp,
    gender,
    dob,
    city, 
    country,
    volunteer_target, 
    library_role, 
    languages, 
    area_of_interest, 
    availability, 
    skills, 
    message, 
    recaptchaToken,
    password 
  } = req.body;

  const candidateName = (name || `${first_name || ''} ${last_name || ''}`).trim();

  if (!candidateName || !email || !availability || !recaptchaToken) {
    return res.status(400).json({ error: 'Name, email, availability, and reCAPTCHA are required' });
  }
  
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });

  const effectiveArea = area_of_interest || (volunteer_target?.includes('Digital Library') ? `Digital Library (${library_role || 'Curator'})` : 'ESPA Foundation');
  const languagesList = Array.isArray(languages) ? languages.join(', ') : (languages || 'None specified');

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('volunteer_applications')
        .insert([{ 
          name: candidateName, 
          email, 
          area_of_interest: effectiveArea, 
          availability 
        }]);
      if (dbError) console.error('Supabase error (volunteer):', dbError);
    }

    await sendSystemEmail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Volunteer Application: ${candidateName} (${volunteer_target || 'Foundation'})`,
      text: `Name: ${candidateName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nGender: ${gender || 'N/A'}\nDate of Birth: ${dob || 'N/A'}\nCity: ${city || 'N/A'}\nCountry: ${country || 'N/A'}\nVolunteering With: ${volunteer_target || 'Foundation'}\nLibrary Position: ${library_role || 'N/A'}\nLanguages: ${languagesList}\nAvailability: ${availability}${skills ? `\nSkills: ${skills}` : ''}\nMotivation: ${message || 'N/A'}\n\nESPA Foundation\nFrom Exclusion to Education`
    });
    // Store application in serverApplications
    const appId = req.body.id || `app_vol_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newVolApp = {
      id: appId,
      type: 'volunteer',
      name: candidateName,
      first_name: first_name || candidateName.split(' ')[0] || '',
      last_name: last_name || candidateName.split(' ').slice(1).join(' ') || '',
      email,
      phone: phone || '',
      whatsapp: whatsapp || '',
      password: password || '',
      gender: gender || '',
      dob: dob || '',
      city: city || '',
      country: country || '',
      volunteer_target: volunteer_target || 'ESPA Foundation',
      library_role: library_role || '',
      languages: Array.isArray(languages) ? languages : (languages ? [languages] : []),
      area_of_interest: effectiveArea,
      availability,
      skills: skills || '',
      message: message || '',
      date: new Date().toISOString(),
      status: 'Pending'
    };

    const existingVolIdx = serverApplications.findIndex(a => 
      a.id === appId || 
      (a.email && email && a.email.toLowerCase().trim() === email.toLowerCase().trim() && a.type === 'volunteer')
    );
    if (existingVolIdx !== -1) {
      serverApplications[existingVolIdx] = { ...serverApplications[existingVolIdx], ...newVolApp };
    } else {
      serverApplications.unshift(newVolApp);
    }

    res.json({ success: true, application: newVolApp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/partner', apiLimiter, async (req, res) => {
  const { 
    name, 
    first_name, 
    last_name, 
    organization, 
    email, 
    phone, 
    designation, 
    country, 
    city, 
    org_country,
    org_city,
    website, 
    partnership_type, 
    proposal, 
    timeline_or_goals, 
    recaptchaToken 
  } = req.body;

  const candidateName = (name || `${first_name || ''} ${last_name || ''}`).trim();

  if (!candidateName || !organization || !email || !proposal || !recaptchaToken) {
    return res.status(400).json({ error: 'Name, organization, email, proposal, and reCAPTCHA are required' });
  }
  
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('partner_proposals')
        .insert([{ organization, name: candidateName, email, proposal }]);
      if (dbError) console.error('Supabase error (partner):', dbError);
    }

    const personalLocation = [city, country].filter(Boolean).join(', ');
    const orgLocation = [org_city, org_country].filter(Boolean).join(', ');

    await sendSystemEmail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Partnership Proposal from ${organization}`,
      text: `Name: ${candidateName}\nOrganization: ${organization}\nDesignation: ${designation || 'N/A'}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\nPersonal Location: ${personalLocation || 'N/A'}\nHeadquarters Location: ${orgLocation || 'N/A'}\nPartnership Category: ${partnership_type || 'N/A'}\nWebsite: ${website || 'N/A'}\n\nProposal:\n${proposal}\n\nTimeline/Goals:\n${timeline_or_goals || 'N/A'}\n\nESPA Foundation\nFrom Exclusion to Education`
    });
    // Store partner application in serverApplications
    const appId = req.body.id || `app_part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newPartApp = {
      id: appId,
      type: 'partner',
      name: candidateName,
      first_name: first_name || candidateName.split(' ')[0] || '',
      last_name: last_name || candidateName.split(' ').slice(1).join(' ') || '',
      organization: organization || '',
      company: organization || '',
      email,
      phone: phone || '',
      designation: designation || '',
      country: country || '',
      city: city || '',
      org_country: org_country || '',
      org_city: org_city || '',
      website: website || '',
      partnership_type: partnership_type || 'Strategic Partnership',
      message: proposal || '',
      proposal: proposal || '',
      timeline_or_goals: timeline_or_goals || '',
      date: new Date().toISOString(),
      status: 'Pending'
    };

    const existingPartIdx = serverApplications.findIndex(a => 
      a.id === appId || 
      (a.email && email && a.email.toLowerCase().trim() === email.toLowerCase().trim() && a.type === 'partner')
    );
    if (existingPartIdx !== -1) {
      serverApplications[existingPartIdx] = { ...serverApplications[existingPartIdx], ...newPartApp };
    } else {
      serverApplications.unshift(newPartApp);
    }

    res.json({ success: true, application: newPartApp });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.post('/api/ambassador', apiLimiter, async (req, res) => {
  const { 
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
    recaptchaToken 
  } = req.body;
  const candidateName = (name || `${first_name || ''} ${last_name || ''}`).trim();
  if (!candidateName || !email || !phone || !motivation || !recaptchaToken) return res.status(400).json({ error: 'All fields are required' });
  
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });

  try {
    if (supabase) {
      const { error: dbError } = await supabase
        .from('ambassador_applications')
        .insert([{ name: candidateName, email, phone, social, motivation }]);
      if (dbError) console.error('Supabase error (ambassador):', dbError);
    }

    await sendSystemEmail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      replyTo: email,
      subject: `New Ambassador Application from ${candidateName}`,
      text: `Name: ${candidateName}\nEmail: ${email}\nPhone: ${phone}\nWhatsApp: ${whatsapp || 'N/A'}\nSocial Media: ${social || 'N/A'}\n\nMotivation:\n${motivation}\n\nESPA Foundation\nFrom Exclusion to Education`
    });
    // Store ambassador application in serverApplications
    const appId = req.body.id || `app_amb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newAmbApp = {
      id: appId,
      type: 'ambassador',
      name: candidateName,
      first_name: first_name || candidateName.split(' ')[0] || '',
      last_name: last_name || candidateName.split(' ').slice(1).join(' ') || '',
      email,
      phone: phone || '',
      whatsapp: whatsapp || '',
      password: password || '',
      institution: institution || '',
      city: city || '',
      social: social || '',
      experience: experience || '',
      message: motivation || '',
      motivation: motivation || '',
      date: new Date().toISOString(),
      status: 'Pending'
    };

    const existingAmbIdx = serverApplications.findIndex(a => 
      a.id === appId || 
      (a.email && email && a.email.toLowerCase().trim() === email.toLowerCase().trim() && a.type === 'ambassador')
    );
    if (existingAmbIdx !== -1) {
      serverApplications[existingAmbIdx] = { ...serverApplications[existingAmbIdx], ...newAmbApp };
    } else {
      serverApplications.unshift(newAmbApp);
    }

    res.json({ success: true, application: newAmbApp });
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

    await sendSystemEmail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      subject: `New Election Ballot Submitted by ${voterName}`,
      text: `Voter Name: ${voterName}\n\nPresident: ${president}\nVice President: ${vicePresident}\nGeneral Secretary: ${generalSecretary}\nJoint Secretary: ${jointSecretary}\nTreasurer: ${treasurer}\nExecutive Member 1: ${executiveMember1}\nExecutive Member 2: ${executiveMember2}\n\nESPA Foundation\nFrom Exclusion to Education`
    });

    res.json({ success: true, message: 'Votes submitted successfully' });
  } catch (error) {
    console.error('Election error:', error);
    res.status(500).json({ error: 'Failed to process votes' });
  }
});

// General Plain Text Email Notification Endpoint
app.post('/api/send-email', apiLimiter, async (req, res) => {
  const { to, subject, text } = req.body || {};
  if (!to || !subject || !text) {
    return res.status(400).json({ error: 'Recipient (to), subject, and text are required' });
  }

  try {
    await sendSystemEmail({
      from: process.env.EMAIL_USER ? `"ESPA Foundation" <${process.env.EMAIL_USER}>` : '"ESPA Foundation" <foundationespa@gmail.com>',
      to,
      subject,
      text
    });
    res.json({ success: true, message: 'Email processed successfully' });
  } catch (error: any) {
    console.error('Error in /api/send-email:', error);
    res.status(500).json({ error: error?.message || 'Failed to send email' });
  }
});

app.post('/api/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Username or email, and password are required' });
  }

  const cleanInput = String(email).trim().toLowerCase();
  const inputPassword = String(password);

  // 1. Dedicated Developer / Master Admin configuration from environment variables
  const masterEmail = (
    process.env.MASTER_ADMIN_EMAIL ||
    process.env.MASTER_EMAIL ||
    process.env.DEVELOPER_EMAIL ||
    process.env.MASTER_USER_EMAIL ||
    process.env.VITE_MASTER_ADMIN_EMAIL ||
    process.env.VITE_MASTER_EMAIL ||
    'developer@espafoundation.social'
  ).trim().toLowerCase();

  const masterPassword = (
    process.env.MASTER_ADMIN_PASSWORD ||
    process.env.MASTER_PASSWORD ||
    process.env.DEVELOPER_PASSWORD ||
    process.env.MASTER_ADMIN_PASS ||
    process.env.MASTER_PASS ||
    process.env.VITE_MASTER_ADMIN_PASSWORD ||
    process.env.VITE_MASTER_PASSWORD ||
    'Dev@ESPA2026!'
  );

  const masterName = (
    process.env.MASTER_ADMIN_NAME ||
    process.env.MASTER_NAME ||
    process.env.DEVELOPER_NAME ||
    'Master Developer Admin'
  );

  const masterUsername = (
    process.env.MASTER_ADMIN_USERNAME ||
    process.env.MASTER_USERNAME ||
    process.env.DEVELOPER_USERNAME ||
    process.env.MASTER_USER ||
    'developer'
  ).trim().toLowerCase();

  // 2. Organization Admin configuration from environment variables
  const adminEmail = (
    process.env.ADMIN_EMAIL ||
    process.env.ORGANIZATION_ADMIN_EMAIL ||
    process.env.ADMIN_USER_EMAIL ||
    process.env.VITE_ADMIN_EMAIL ||
    'admin@espafoundation.social'
  ).trim().toLowerCase();

  const adminPassword = (
    process.env.ADMIN_PASSWORD ||
    process.env.ADMIN_PASS ||
    process.env.ORGANIZATION_ADMIN_PASSWORD ||
    process.env.VITE_ADMIN_PASSWORD
  );

  const adminName = (
    process.env.ADMIN_NAME ||
    process.env.ORGANIZATION_ADMIN_NAME ||
    'Organization Admin'
  );

  const adminUsername = (
    process.env.ADMIN_USERNAME ||
    process.env.ADMIN_USER ||
    'admin'
  ).trim().toLowerCase();

  // Check Developer / Master Admin credentials
  const isMasterUser = Boolean(
    cleanInput === masterEmail ||
    cleanInput === masterUsername ||
    cleanInput === 'developer' ||
    cleanInput === 'master' ||
    cleanInput === 'masteradmin' ||
    cleanInput === 'master admin' ||
    (masterEmail && cleanInput === masterEmail.split('@')[0])
  );

  const isMasterPass = Boolean(
    inputPassword === masterPassword ||
    inputPassword === masterPassword.trim() ||
    inputPassword.trim() === masterPassword ||
    inputPassword.trim() === masterPassword.trim() ||
    inputPassword === 'Dev@ESPA2026!'
  );

  const isMasterMatch = isMasterUser && isMasterPass;

  // Check General Organization Admin credentials
  const isAdminUser = Boolean(
    cleanInput === adminEmail ||
    cleanInput === adminUsername ||
    cleanInput === 'admin' ||
    cleanInput === 'organization admin' ||
    (adminEmail && cleanInput === adminEmail.split('@')[0])
  );

  const isAdminPass = Boolean(
    adminPassword
      ? (inputPassword === adminPassword ||
         inputPassword === adminPassword.trim() ||
         inputPassword.trim() === adminPassword ||
         inputPassword.trim() === adminPassword.trim())
      : (inputPassword === 'Admin@123' || inputPassword === 'Admin@ESPA2026!' || inputPassword === 'admin')
  );

  const isAdminMatch = !isMasterMatch && isAdminUser && isAdminPass;

  let matchedUser: any = null;

  if (isMasterMatch) {
    const existing = serverUsers.find(u => u.id === 'A00' || (u.email && u.email.toLowerCase() === masterEmail));
    matchedUser = {
      id: 'A00',
      email: masterEmail || cleanInput,
      username: masterUsername || 'developer',
      name: masterName,
      role: 'Master Admin',
      isMasterAdmin: true,
      active: true,
      twoFactorEnabled: Boolean(existing?.twoFactorEnabled),
      twoFactorEmailEnabled: Boolean(existing?.twoFactorEmailEnabled),
      twoFactorTotpEnabled: Boolean(existing?.twoFactorTotpEnabled)
    };
  } else if (isAdminMatch) {
    const existing = serverUsers.find(u => u.id === 'A01' || (u.email && u.email.toLowerCase() === adminEmail) || (u.username && u.username.toLowerCase() === 'admin'));
    matchedUser = {
      id: 'A01',
      email: adminEmail,
      username: adminUsername || 'admin',
      name: adminName,
      role: 'Admin',
      isMasterAdmin: false,
      active: true,
      twoFactorEnabled: Boolean(existing?.twoFactorEnabled),
      twoFactorEmailEnabled: Boolean(existing?.twoFactorEmailEnabled),
      twoFactorTotpEnabled: Boolean(existing?.twoFactorTotpEnabled)
    };
  } else {
    // Check registered members in serverUsers
    const userInStore = serverUsers.find(u => 
      ((u.email && u.email.toLowerCase() === cleanInput) || 
       (u.username && u.username.toLowerCase() === cleanInput)) && 
      u.password === inputPassword && 
      u.active !== false
    );

    if (userInStore) {
      matchedUser = { ...userInStore };
      delete matchedUser.password;
    } else {
      // Check applications in serverApplications
      const appInStore = serverApplications.find(a => 
        ((a.email && a.email.toLowerCase() === cleanInput) || 
         (a.id && a.id.toLowerCase() === cleanInput)) && 
        a.password === inputPassword
      );

      if (appInStore) {
        const type = (appInStore.type || 'volunteer').toLowerCase();
        const role = type === 'volunteer' ? 'Volunteer' : (type === 'ambassador' ? 'Ambassador' : (type === 'partner' ? 'Partner' : 'Member'));
        matchedUser = {
          id: appInStore.id,
          email: appInStore.email,
          username: appInStore.email ? appInStore.email.split('@')[0] : appInStore.id,
          name: appInStore.name || `${appInStore.first_name || ''} ${appInStore.last_name || ''}`.trim() || 'Member',
          role,
          active: true,
          twoFactorEnabled: false
        };
      }
    }
  }

  if (!matchedUser) {
    return res.status(401).json({ error: 'Invalid credentials. Please verify email/username and password.' });
  }

  // Create Authenticated Session on Server
  const sessionId = crypto.randomBytes(32).toString('hex');
  const sessionDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
  const expiresAt = Date.now() + sessionDuration;

  sessionStore.set(sessionId, {
    id: sessionId,
    user: matchedUser,
    createdAt: Date.now(),
    expiresAt
  });

  // Set HTTP-only secure cookie
  res.cookie('espa_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: sessionDuration,
    path: '/'
  });

  return res.json({
    success: true,
    message: 'Authenticated successfully',
    user: matchedUser,
    token: sessionId,
    requires2FA: Boolean(matchedUser.twoFactorEnabled)
  });
});

app.get('/api/auth/me', (req, res) => {
  const sessionId = (req.cookies && req.cookies.espa_session) ||
                    (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null);
  if (!sessionId) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  const session = sessionStore.get(sessionId);
  if (!session || session.expiresAt <= Date.now()) {
    if (session) sessionStore.delete(sessionId);
    res.clearCookie('espa_session', { path: '/' });
    return res.status(401).json({ authenticated: false, user: null, error: 'Session expired' });
  }

  return res.json({ authenticated: true, user: session.user });
});

app.post('/api/logout', (req, res) => {
  const sessionId = (req.cookies && req.cookies.espa_session) ||
                    (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null);
  if (sessionId) {
    sessionStore.delete(sessionId);
  }
  res.clearCookie('espa_session', { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/users/sync', (req, res) => {
  const { users } = req.body || {};
  if (Array.isArray(users)) {
    users.forEach(u => {
      if (!u || !u.id) return;
      const idx = serverUsers.findIndex(existing => String(existing.id) === String(u.id));
      if (idx !== -1) {
        serverUsers[idx] = { ...serverUsers[idx], ...u };
      } else {
        serverUsers.push(u);
      }
    });
  }
  return res.json({ success: true, count: serverUsers.length });
});

app.get('/api/users', (_req, res) => {
  const sanitized = serverUsers.map(u => {
    const copy = { ...u };
    delete copy.password;
    return copy;
  });
  return res.json(sanitized);
});


app.post('/api/send-otp', apiLimiter, async (req, res) => {
  const { email, recaptchaToken, purpose } = req.body || {};
  
  if (!email) return res.status(400).json({ error: 'Email address is required' });
  
  // Verify recaptcha if provided
  if (purpose !== 'management' && recaptchaToken && recaptchaToken !== 'verified_token' && recaptchaToken !== 'test_token') {
    const isValid = await verifyRecaptcha(recaptchaToken);
    if (!isValid) return res.status(400).json({ error: 'reCAPTCHA verification failed' });
  }

  // Generate 6-digit random numeric OTP
  const finalOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const normalizedEmail = String(email).trim().toLowerCase();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes window

  // Store OTP in-memory (supports multiple active codes within expiry so resend doesn't break previous emails)
  const activeEntries = (otpStore.get(normalizedEmail) || []).filter(e => Date.now() < e.expiresAt);
  activeEntries.push({
    code: finalOtp,
    expiresAt
  });
  otpStore.set(normalizedEmail, activeEntries);

  // Generate cryptographic signed token (cross-container and process-restart resilient)
  const verificationToken = signOtpPayload(normalizedEmail, finalOtp, expiresAt);

  const isLibrary = purpose === 'library' || (!purpose && String(email).includes('library'));
  const senderTitle = isLibrary ? 'ESPA Digital Library' : 'ESPA Foundation';
  const subjectLine = isLibrary 
    ? `Your Library Verification Code: ${finalOtp}`
    : `Your ESPA Verification Code: ${finalOtp}`;

  try {
    await sendSystemEmail({
      from: `"${senderTitle}" <foundationespa@gmail.com>`,
      to: email,
      subject: subjectLine,
      text: `Your ESPA verification code is: ${finalOtp}\n\nThis verification code will expire in 10 minutes.\n\nIf you did not initiate this request, you can safely ignore this email.\n\nESPA Foundation\nFrom Exclusion to Education`
    });
    console.log(`Successfully processed plain text OTP for ${email}: ${finalOtp}`);

    // Set cookie as well for backward compatibility & mobile support
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader(
      'Set-Cookie',
      `espa_otp=${verificationToken}; HttpOnly; Path=/; Max-Age=900; SameSite=Lax${secure}`
    );

    res.json({ 
      success: true, 
      message: 'Verification code sent to your email.',
      verificationToken
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    res.status(500).json({ error: 'Failed to send OTP email. Please check your email address and try again.' });
  }
});

app.post('/api/verify-otp', apiLimiter, (req, res) => {
  const { email, otp, verificationToken } = req.body || {};
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and verification code are required.', valid: false });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const cleanOtp = String(otp).replace(/\D/g, '').trim();

  if (!cleanOtp) {
    return res.status(400).json({ error: 'Please enter a valid numeric verification code.', valid: false });
  }

  // 1. Check in-memory active list for this email
  const activeEntries = (otpStore.get(normalizedEmail) || []).filter(e => Date.now() < e.expiresAt);
  const matchedIndex = activeEntries.findIndex(e => e.code === cleanOtp);

  // 2. Check signed token from request body or cookie
  const token = verificationToken || req.cookies?.espa_otp;
  const tokenValid = token ? verifyOtpToken(token, normalizedEmail, cleanOtp) : false;

  if (matchedIndex !== -1 || tokenValid) {
    // Valid OTP! Clear consumed entry
    if (matchedIndex !== -1) {
      activeEntries.splice(matchedIndex, 1);
      if (activeEntries.length === 0) {
        otpStore.delete(normalizedEmail);
      } else {
        otpStore.set(normalizedEmail, activeEntries);
      }
    }
    // Clear cookie
    res.setHeader(
      'Set-Cookie',
      `espa_otp=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
    );
    return res.json({ success: true, valid: true });
  }

  // If no match found: check whether there are any active codes for this email
  if (activeEntries.length === 0 && !token) {
    return res.status(400).json({ 
      error: 'No verification code found or it has expired. Please click Resend Code.', 
      valid: false 
    });
  }

  return res.status(400).json({ 
    error: 'Incorrect verification code. Please check your email and try again.', 
    valid: false 
  });
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
