import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: 'foundationespa@gmail.com', pass: 'xzxp ilzw hiwu sjcr' },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { name, email, area_of_interest, availability, recaptchaToken } = req.body;
  
  try {
    const recaptchaSecret = process.env.RECAPTCHA_SECRET || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
    });
    const verifyData = await verifyRes.json();
    
    if (!verifyData.success) {
      return res.status(400).json({ error: 'reCAPTCHA validation failed.' });
    }

    if (supabase) {
      const { error: dbError } = await supabase
        .from('volunteer_applications')
        .insert([{ name, email, area_of_interest, availability }]);
      if (dbError) console.error('Supabase error (volunteer):', dbError);
    }

    await transporter.sendMail({
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
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Email service error: ' + error.message });
  }
}
