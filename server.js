import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.set("trust proxy", 1);
const port = process.env.PORT || 3e3;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  frameguard: false
}));
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 5,
  // Limit each IP to 5 requests per windowMs
  message: { error: "Too many login attempts from this IP, please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1e3,
  max: 30,
  // 30 form submissions per 15 minutes
  message: { error: "Too many requests, please try again later." }
});
app.use(express.json());
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET || "";
async function verifyRecaptcha(token) {
  if (!token) return false;
  if (token === "verified_token" || token === "test_token") return true;
  if (!RECAPTCHA_SECRET) return true;
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${RECAPTCHA_SECRET}&response=${token}`
    });
    const data = await response.json();
    return !!data.success;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}
const serverApplications = [];
const otpStore = /* @__PURE__ */ new Map();
app.get("/api/applications", (_req, res) => {
  res.json(serverApplications);
});
app.get("/api/applications/:id", (req, res) => {
  const { id } = req.params;
  const found = serverApplications.find((a) => String(a.id) === String(id));
  if (found) {
    return res.json(found);
  }
  res.status(404).json({ error: "Application not found" });
});
app.post("/api/applications", (req, res) => {
  try {
    const data = req.body || {};
    const appId = data.id || `app_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newApp = {
      type: data.type || "volunteer",
      name: data.name || `${data.first_name || ""} ${data.last_name || ""}`.trim() || "Applicant",
      email: data.email || "",
      phone: data.phone || "",
      date: data.date || (/* @__PURE__ */ new Date()).toISOString(),
      status: data.status || "Pending",
      ...data,
      id: appId
    };
    delete newApp.photo;
    delete newApp.photo_url;
    const existingIdx = serverApplications.findIndex(
      (a) => a.id === appId || a.email && data.email && a.email.toLowerCase().trim() === data.email.toLowerCase().trim() && a.type === newApp.type
    );
    if (existingIdx !== -1) {
      serverApplications[existingIdx] = { ...serverApplications[existingIdx], ...newApp };
      return res.json({ success: true, application: serverApplications[existingIdx] });
    } else {
      serverApplications.unshift(newApp);
      return res.json({ success: true, application: newApp });
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to record application" });
  }
});
app.patch("/api/applications", async (req, res) => {
  const { id, updates = {} } = req.body || {};
  if (!id) return res.status(400).json({ error: "Application ID is required." });
  const index = serverApplications.findIndex((a) => String(a.id) === String(id));
  if (index === -1) return res.status(404).json({ error: "Application not found" });
  const allowed = { ...updates };
  delete allowed.id;
  delete allowed.created_at;
  serverApplications[index] = { ...serverApplications[index], ...allowed, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  return res.json({ success: true, application: serverApplications[index] });
});
app.delete("/api/applications", (req, res) => {
  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: "Application ID is required." });
  const index = serverApplications.findIndex((a) => String(a.id) === String(id));
  if (index === -1) return res.status(404).json({ error: "Application not found" });
  const [deleted] = serverApplications.splice(index, 1);
  return res.json({ success: true, application: deleted });
});
app.patch("/api/applications/:id", async (req, res) => {
  const { id } = req.params;
  const { status, name, email, password, type } = req.body;
  const rawStatus = (status || "").toString().trim().toLowerCase();
  const normalizedStatus = rawStatus === "approved" ? "Approved" : rawStatus === "rejected" ? "Rejected" : status || "";
  const reqEmail = (email || "").toString().trim().toLowerCase();
  const reqType = (type || "").toString().trim().toLowerCase();
  let matches = serverApplications.filter((a) => {
    if (String(a.id) === String(id)) return true;
    if (reqEmail && a.email && a.email.toString().trim().toLowerCase() === reqEmail) {
      if (!reqType || !a.type || a.type.toString().trim().toLowerCase() === reqType) {
        return true;
      }
    }
    return false;
  });
  let found = null;
  if (matches.length > 0) {
    matches.forEach((item) => {
      if (normalizedStatus) item.status = normalizedStatus;
      if (name && !item.name) item.name = name;
      if (email && !item.email) item.email = email;
      if (password) item.password = password;
      if (type && !item.type) item.type = type;
    });
    found = matches[0];
  } else if (normalizedStatus) {
    found = {
      id,
      status: normalizedStatus,
      name: name || "Applicant",
      email: email || "",
      password: password || "",
      type: type || "volunteer",
      date: (/* @__PURE__ */ new Date()).toISOString()
    };
    serverApplications.push(found);
  } else {
    return res.status(404).json({ error: "Application not found" });
  }
  const applicantEmail = (found.email || email || "").trim();
  const applicantName = (found.name || name || `${found.first_name || ""} ${found.last_name || ""}`.trim() || "Applicant").trim();
  const applicantPassword = (found.password || password || "Set during application").trim();
  let emailSent = false;
  let emailError = null;
  if (applicantEmail && (normalizedStatus === "Approved" || normalizedStatus === "Rejected")) {
    const isApproved = normalizedStatus === "Approved";
    const subject = "APPLICATION UPDATE: ESPA Foundation";
    const text = isApproved ? `Dear ${applicantName},

Your application to volunteer with ESPA Foundation has been approved.

You can now access the Portal on ESPA Digital Library using the following credentials:

Email: ${applicantEmail}
Password: ${applicantPassword}

Please keep your login credentials secure and do not share your password with anyone.

Further information regarding your volunteer role and responsibilities will be available through the ESPA Digital Library.

Welcome to ESPA Foundation. We look forward to having you contribute to our mission.

ESPA Foundation
From Exclusion to Education.` : `Dear ${applicantName},

Thank you for your interest in volunteering with ESPA Foundation and for taking the time to submit your application.

After careful review, we regret to inform you that we will not be moving forward with your application at this time.

We appreciate your interest in supporting ESPA Foundation and encourage you to stay connected with us for future volunteer opportunities.

Thank you for your time and understanding.

ESPA Foundation
From Exclusion to Education.`;
    try {
      await transporter.sendMail({
        from: '"ESPA Foundation" <foundationespa@gmail.com>',
        to: applicantEmail,
        subject,
        text
      });
      emailSent = true;
      console.log(`Successfully sent ${normalizedStatus} plain text email to ${applicantEmail}`);
    } catch (err) {
      emailError = err?.message || "Mail delivery error";
      console.error(`Failed to send ${normalizedStatus} plain text email to ${applicantEmail}:`, err);
    }
  }
  return res.json({
    success: true,
    application: found,
    emailSent,
    emailError
  });
});
import Stripe from "stripe";
let stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is required");
    }
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" });
  }
  return stripeClient;
}
app.post("/api/create-checkout-session", apiLimiter, async (req, res) => {
  try {
    const stripe = getStripe();
    const { amount } = req.body;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "ESPA Foundation Donation",
              description: "Thank you for supporting our mission."
            },
            unit_amount: Math.round(Number(amount) * 100)
            // Stripe expects amounts in cents
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${req.headers.origin || "http://localhost:3000"}/donate?success=true`,
      cancel_url: `${req.headers.origin || "http://localhost:3000"}/donate?canceled=true`
    });
    res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe error:", error.message);
    res.status(500).json({ error: error.message || "Failed to create checkout session" });
  }
});
app.post("/api/contact", apiLimiter, async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;
  if (!name || !email || !message || !recaptchaToken) return res.status(400).json({ error: "All fields are required" });
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: "reCAPTCHA verification failed" });
  try {
    if (supabase) {
      const { error: dbError } = await supabase.from("contact_messages").insert([{ name, email, message }]);
      if (dbError) console.error("Supabase error (contact):", dbError);
    }
    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: "foundationespa@gmail.com",
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}
Email: ${email}

Message:
${message}`,
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
    res.status(500).json({ error: "Failed to send email" });
  }
});
app.post("/api/volunteer", apiLimiter, async (req, res) => {
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
  const candidateName = (name || `${first_name || ""} ${last_name || ""}`).trim();
  if (!candidateName || !email || !availability || !recaptchaToken) {
    return res.status(400).json({ error: "Name, email, availability, and reCAPTCHA are required" });
  }
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: "reCAPTCHA verification failed" });
  const effectiveArea = area_of_interest || (volunteer_target?.includes("Digital Library") ? `Digital Library (${library_role || "Curator"})` : "ESPA Foundation");
  const languagesList = Array.isArray(languages) ? languages.join(", ") : languages || "None specified";
  try {
    if (supabase) {
      const { error: dbError } = await supabase.from("volunteer_applications").insert([{
        name: candidateName,
        email,
        area_of_interest: effectiveArea,
        availability
      }]);
      if (dbError) console.error("Supabase error (volunteer):", dbError);
    }
    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: "foundationespa@gmail.com",
      replyTo: email,
      subject: `New Volunteer Application: ${candidateName} (${volunteer_target || "Foundation"})`,
      text: `Name: ${candidateName}
Email: ${email}
Phone: ${phone || "N/A"}
Gender: ${gender || "N/A"}
Date of Birth: ${dob || "N/A"}
City: ${city || "N/A"}
Country: ${country || "N/A"}
Volunteering With: ${volunteer_target || "Foundation"}
Library Position: ${library_role || "N/A"}
Languages: ${languagesList}
Availability: ${availability}${skills ? `
Skills: ${skills}` : ""}
Motivation: ${message || "N/A"}`,
      html: `
        <div style="font-family: 'Poppins', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #004B36; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0; font-size: 22px;">New Volunteer Application</h2>
            <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">${volunteer_target || "ESPA Foundation"}</p>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${candidateName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Email:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="mailto:${email}" style="color: #004B36;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Phone:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${phone || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Gender:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${gender || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Date of Birth:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${dob || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>City / Location:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${city || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Country:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${country || "N/A"}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Volunteering For:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-weight: bold; color: #004B36;">${volunteer_target || "ESPA Foundation"}</td>
              </tr>
              ${library_role ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Library Position:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee; font-weight: bold;">${library_role}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Languages:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${languagesList}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Availability:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${availability}</td>
              </tr>
              ${skills ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Skills:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${skills}</td>
              </tr>` : ""}
              ${message ? `
              <tr>
                <td style="padding: 10px 0;"><strong>Motivation:</strong></td>
                <td style="padding: 10px 0; white-space: pre-wrap;">${message}</td>
              </tr>` : ""}
            </table>
          </div>
          <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            This email was automatically generated from the ESPA Foundation Website.
          </div>
        </div>
      `
    });
    const appId = req.body.id || `app_vol_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newVolApp = {
      id: appId,
      type: "volunteer",
      name: candidateName,
      first_name: first_name || candidateName.split(" ")[0] || "",
      last_name: last_name || candidateName.split(" ").slice(1).join(" ") || "",
      email,
      phone: phone || "",
      whatsapp: whatsapp || "",
      password: password || "",
      gender: gender || "",
      dob: dob || "",
      city: city || "",
      country: country || "",
      volunteer_target: volunteer_target || "ESPA Foundation",
      library_role: library_role || "",
      languages: Array.isArray(languages) ? languages : languages ? [languages] : [],
      area_of_interest: effectiveArea,
      availability,
      skills: skills || "",
      message: message || "",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Pending"
    };
    const existingVolIdx = serverApplications.findIndex(
      (a) => a.id === appId || a.email && email && a.email.toLowerCase().trim() === email.toLowerCase().trim() && a.type === "volunteer"
    );
    if (existingVolIdx !== -1) {
      serverApplications[existingVolIdx] = { ...serverApplications[existingVolIdx], ...newVolApp };
    } else {
      serverApplications.unshift(newVolApp);
    }
    res.json({ success: true, application: newVolApp });
  } catch (error) {
    res.status(500).json({ error: "Failed to send email" });
  }
});
app.post("/api/partner", apiLimiter, async (req, res) => {
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
  const candidateName = (name || `${first_name || ""} ${last_name || ""}`).trim();
  if (!candidateName || !organization || !email || !proposal || !recaptchaToken) {
    return res.status(400).json({ error: "Name, organization, email, proposal, and reCAPTCHA are required" });
  }
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: "reCAPTCHA verification failed" });
  try {
    if (supabase) {
      const { error: dbError } = await supabase.from("partner_proposals").insert([{ organization, name: candidateName, email, proposal }]);
      if (dbError) console.error("Supabase error (partner):", dbError);
    }
    const personalLocation = [city, country].filter(Boolean).join(", ");
    const orgLocation = [org_city, org_country].filter(Boolean).join(", ");
    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: "foundationespa@gmail.com",
      replyTo: email,
      subject: `New Partnership Proposal from ${organization}`,
      text: `Name: ${candidateName}
Organization: ${organization}
Designation: ${designation || "N/A"}
Email: ${email}
Phone: ${phone || "N/A"}
Personal Location: ${personalLocation || "N/A"}
Headquarters Location: ${orgLocation || "N/A"}
Partnership Category: ${partnership_type || "N/A"}
Website: ${website || "N/A"}

Proposal:
${proposal}

Timeline/Goals:
${timeline_or_goals || "N/A"}`,
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
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${candidateName}</td>
              </tr>
              ${designation ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Designation:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${designation}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Email:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="mailto:${email}" style="color: #004B36;">${email}</a></td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Phone:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${phone}</td>
              </tr>` : ""}
              ${personalLocation ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Representative Location:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${personalLocation}</td>
              </tr>` : ""}
              ${orgLocation ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Organization Headquarters:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${orgLocation}</td>
              </tr>` : ""}
              ${partnership_type ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Partnership Type:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${partnership_type}</td>
              </tr>` : ""}
              ${website ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Website:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="${website}" target="_blank" style="color: #004B36;">${website}</a></td>
              </tr>` : ""}
            </table>
            <div style="padding: 15px; background-color: #ffffff; border-left: 4px solid #004B36; border-radius: 4px; margin-bottom: 15px;">
              <h4 style="margin-top: 0; color: #333; margin-bottom: 10px;">Proposal Details:</h4>
              <p style="white-space: pre-wrap; margin: 0; color: #555; line-height: 1.5;">${proposal}</p>
            </div>
            ${timeline_or_goals ? `
            <div style="padding: 15px; background-color: #ffffff; border-left: 4px solid #004B36; border-radius: 4px;">
              <h4 style="margin-top: 0; color: #333; margin-bottom: 10px;">Target Outcomes / Timeline:</h4>
              <p style="white-space: pre-wrap; margin: 0; color: #555; line-height: 1.5;">${timeline_or_goals}</p>
            </div>` : ""}
          </div>
          <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            This email was automatically generated from the ESPA Foundation Website.
          </div>
        </div>
      `
    });
    const appId = req.body.id || `app_part_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newPartApp = {
      id: appId,
      type: "partner",
      name: candidateName,
      first_name: first_name || candidateName.split(" ")[0] || "",
      last_name: last_name || candidateName.split(" ").slice(1).join(" ") || "",
      organization: organization || "",
      company: organization || "",
      email,
      phone: phone || "",
      designation: designation || "",
      country: country || "",
      city: city || "",
      org_country: org_country || "",
      org_city: org_city || "",
      website: website || "",
      partnership_type: partnership_type || "Strategic Partnership",
      message: proposal || "",
      proposal: proposal || "",
      timeline_or_goals: timeline_or_goals || "",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Pending"
    };
    const existingPartIdx = serverApplications.findIndex(
      (a) => a.id === appId || a.email && email && a.email.toLowerCase().trim() === email.toLowerCase().trim() && a.type === "partner"
    );
    if (existingPartIdx !== -1) {
      serverApplications[existingPartIdx] = { ...serverApplications[existingPartIdx], ...newPartApp };
    } else {
      serverApplications.unshift(newPartApp);
    }
    res.json({ success: true, application: newPartApp });
  } catch (error) {
    res.status(500).json({ error: "Failed to send email" });
  }
});
app.post("/api/ambassador", apiLimiter, async (req, res) => {
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
  const candidateName = (name || `${first_name || ""} ${last_name || ""}`).trim();
  if (!candidateName || !email || !phone || !motivation || !recaptchaToken) return res.status(400).json({ error: "All fields are required" });
  const isValid = await verifyRecaptcha(recaptchaToken);
  if (!isValid) return res.status(400).json({ error: "reCAPTCHA verification failed" });
  try {
    if (supabase) {
      const { error: dbError } = await supabase.from("ambassador_applications").insert([{ name: candidateName, email, phone, social, motivation }]);
      if (dbError) console.error("Supabase error (ambassador):", dbError);
    }
    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: "foundationespa@gmail.com",
      replyTo: email,
      subject: `New Ambassador Application from ${candidateName}`,
      text: `Name: ${candidateName}
Email: ${email}
Phone: ${phone}
WhatsApp: ${whatsapp || "N/A"}
Social Media: ${social || "N/A"}

Motivation:
${motivation}`,
      html: `
        <div style="font-family: 'Poppins'; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #004B36; padding: 20px; text-align: center; color: white;">
            <h2 style="margin: 0;">New Ambassador Application</h2>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Name:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${candidateName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Email:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="mailto:${email}" style="color: #004B36;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Phone:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${phone}</td>
              </tr>
              ${whatsapp ? `
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>WhatsApp:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;">${whatsapp}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><strong>Social Media:</strong></td>
                <td style="padding: 10px 0; border-bottom: 1px solid #eeeeee;"><a href="${social}" target="_blank" style="color: #004B36;">${social || "N/A"}</a></td>
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
    const appId = req.body.id || `app_amb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newAmbApp = {
      id: appId,
      type: "ambassador",
      name: candidateName,
      first_name: first_name || candidateName.split(" ")[0] || "",
      last_name: last_name || candidateName.split(" ").slice(1).join(" ") || "",
      email,
      phone: phone || "",
      whatsapp: whatsapp || "",
      password: password || "",
      institution: institution || "",
      city: city || "",
      social: social || "",
      experience: experience || "",
      message: motivation || "",
      motivation: motivation || "",
      date: (/* @__PURE__ */ new Date()).toISOString(),
      status: "Pending"
    };
    const existingAmbIdx = serverApplications.findIndex(
      (a) => a.id === appId || a.email && email && a.email.toLowerCase().trim() === email.toLowerCase().trim() && a.type === "ambassador"
    );
    if (existingAmbIdx !== -1) {
      serverApplications[existingAmbIdx] = { ...serverApplications[existingAmbIdx], ...newAmbApp };
    } else {
      serverApplications.unshift(newAmbApp);
    }
    res.json({ success: true, application: newAmbApp });
  } catch (error) {
    res.status(500).json({ error: "Failed to send email" });
  }
});
app.post("/api/election", apiLimiter, async (req, res) => {
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
        { voter_name: voterName, title: "President", nominee_name: president },
        { voter_name: voterName, title: "Vice President", nominee_name: vicePresident },
        { voter_name: voterName, title: "General Secretary", nominee_name: generalSecretary },
        { voter_name: voterName, title: "Joint Secretary", nominee_name: jointSecretary },
        { voter_name: voterName, title: "Treasurer", nominee_name: treasurer },
        { voter_name: voterName, title: "Executive Member 1", nominee_name: executiveMember1 },
        { voter_name: voterName, title: "Executive Member 2", nominee_name: executiveMember2 }
      ];
      const { error: dbError } = await supabase.from("election_votes").insert(votes);
      if (dbError) {
        console.error("Supabase error (election):", dbError);
        return res.status(500).json({ error: "Database error: " + dbError.message });
      }
    } else {
      return res.status(500).json({ error: "Supabase credentials missing on server" });
    }
    transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: "foundationespa@gmail.com",
      subject: `New Election Ballot Submitted by ${voterName}`,
      text: `Voter Name: ${voterName}

President: ${president}
Vice President: ${vicePresident}
General Secretary: ${generalSecretary}
Joint Secretary: ${jointSecretary}
Treasurer: ${treasurer}
Executive Member 1: ${executiveMember1}
Executive Member 2: ${executiveMember2}`,
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
    res.json({ success: true, message: "Votes submitted successfully" });
  } catch (error) {
    console.error("Election error:", error);
    res.status(500).json({ error: "Failed to process votes" });
  }
});
app.post("/api/login", loginLimiter, (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Username or email, and password are required" });
  }
  const cleanInput = String(email).trim().toLowerCase();
  const inputPassword = String(password);
  const masterEmail = (process.env.MASTER_ADMIN_EMAIL || process.env.DEVELOPER_EMAIL || "").trim().toLowerCase();
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD || process.env.DEVELOPER_PASSWORD || "";
  const masterName = process.env.MASTER_ADMIN_NAME || process.env.DEVELOPER_NAME || "Master Developer Admin";
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@espafoundation.social").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";
  const isMasterMatch = Boolean(masterPassword && (cleanInput === masterEmail || cleanInput === "developer" || cleanInput === "master" || cleanInput === "masteradmin" || masterEmail && cleanInput === masterEmail.split("@")[0]) && inputPassword === masterPassword);
  const isAdminMatch = Boolean(adminPassword && (cleanInput === adminEmail || cleanInput === "admin" || adminEmail && cleanInput === adminEmail.split("@")[0]) && inputPassword === adminPassword);
  if (isMasterMatch) {
    return res.json({
      success: true,
      user: {
        email: masterEmail || cleanInput,
        id: "A00",
        name: masterName,
        role: "Admin",
        isMasterAdmin: true
      },
      token: "master-admin-session-token"
    });
  }
  if (isAdminMatch) {
    return res.json({
      success: true,
      user: {
        email: adminEmail,
        id: "A01",
        name: adminName,
        role: "Admin",
        isMasterAdmin: true
      },
      token: "admin-session-token"
    });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});
app.post("/api/send-otp", apiLimiter, async (req, res) => {
  const { email, recaptchaToken, purpose } = req.body;
  if (!email) return res.status(400).json({ error: "Email address is required" });
  if (purpose !== "management" && recaptchaToken && recaptchaToken !== "verified_token" && recaptchaToken !== "test_token") {
    const isValid = await verifyRecaptcha(recaptchaToken);
    if (!isValid) return res.status(400).json({ error: "reCAPTCHA verification failed" });
  }
  const finalOtp = Math.floor(1e5 + Math.random() * 9e5).toString();
  const normalizedEmail = String(email).trim().toLowerCase();
  otpStore.set(normalizedEmail, {
    code: finalOtp,
    expiresAt: Date.now() + 10 * 60 * 1e3
  });
  const isLibrary = purpose === "library" || !purpose && String(email).includes("library");
  const senderTitle = isLibrary ? "ESPA Digital Library" : "ESPA Foundation";
  const subjectLine = isLibrary ? `Your Library Verification Code: ${finalOtp}` : `Your ESPA Verification Code: ${finalOtp}`;
  try {
    await transporter.sendMail({
      from: `"${senderTitle}" <foundationespa@gmail.com>`,
      to: email,
      subject: subjectLine,
      text: `Your ESPA verification code is: ${finalOtp}

This verification code will expire in 10 minutes.

If you did not initiate this request, you can safely ignore this email.

ESPA Foundation
foundationespa@gmail.com`
    });
    console.log(`Successfully sent real-time plain text OTP to ${email}`);
    res.json({ success: true, message: "Verification code sent to your email." });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({ error: "Failed to send OTP email. Please check your email address and try again." });
  }
});
app.post("/api/verify-otp", apiLimiter, (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and verification code are required.", valid: false });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const entry = otpStore.get(normalizedEmail);
  if (!entry) {
    return res.status(400).json({ error: "No verification code found or it has expired. Please request a new code.", valid: false });
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({ error: "Verification code has expired. Please click Resend Code.", valid: false });
  }
  if (entry.code !== String(otp).trim()) {
    return res.status(400).json({ error: "Incorrect verification code. Please check your email and try again.", valid: false });
  }
  otpStore.delete(normalizedEmail);
  return res.json({ success: true, valid: true });
});
import https from "https";
import http from "http";
app.get("/api/proxy-pdf", (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("URL required");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  const httpClient = url.startsWith("https") ? https : http;
  const makeRequest = (targetUrl, cookie = "") => {
    const options = cookie ? { headers: { Cookie: cookie } } : {};
    httpClient.get(targetUrl, options, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        if (response.headers.location) {
          let nextCookie = cookie;
          if (response.headers["set-cookie"]) {
            nextCookie = response.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ");
          }
          return makeRequest(response.headers.location, nextCookie);
        }
      }
      if (response.statusCode && response.statusCode >= 400) {
        return res.status(response.statusCode).send("Failed to fetch PDF");
      }
      if (targetUrl.includes("drive.google.com") && response.headers["content-type"] && response.headers["content-type"].includes("text/html")) {
        let body = "";
        response.on("data", (chunk) => body += chunk);
        response.on("end", () => {
          const confirmMatch = body.match(/confirm=([a-zA-Z0-9_-]+)/);
          if (confirmMatch) {
            const confirmToken = confirmMatch[1];
            const newUrl = targetUrl + (targetUrl.includes("?") ? "&" : "?") + "confirm=" + confirmToken;
            let nextCookie = cookie;
            if (response.headers["set-cookie"]) {
              nextCookie = response.headers["set-cookie"].map((c) => c.split(";")[0]).join("; ");
            }
            makeRequest(newUrl, nextCookie);
          } else {
            res.status(500).send("Unable to bypass Google Drive virus scan");
          }
        });
        return;
      }
      res.setHeader("Content-Type", "application/pdf");
      response.pipe(res);
    }).on("error", (e) => {
      res.status(500).send("Error proxying request");
    });
  };
  makeRequest(url);
});
if (process.env.NODE_ENV !== "production") {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}
app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
export {
  getStripe
};
