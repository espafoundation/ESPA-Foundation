import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase GET applications error:', error);
        return res.status(500).json({ error: 'Failed to retrieve applications.', details: error.message });
      }

      return res.status(200).json(data || []);
    } catch (error) {
      console.error('GET applications error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PATCH' || req.method === 'POST') {
    const { id, status, name, email, password } = req.body || {};
    const normalizedStatus = String(status || '').trim().toLowerCase() === 'approved'
      ? 'Approved'
      : String(status || '').trim().toLowerCase() === 'rejected'
        ? 'Rejected'
        : status || '';

    if (!id) return res.status(400).json({ error: 'Application ID is required.' });
    if (!['Approved', 'Rejected'].includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from('volunteer_applications')
      .update({ status: normalizedStatus, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase status update error:', updateError);
      return res.status(500).json({ error: 'Failed to update application status.', details: updateError.message });
    }

    let emailSent = false;
    let emailError = null;
    const applicantEmail = String(email || updatedApp?.email || '').trim();
    const applicantName = String(name || updatedApp?.name || 'Applicant').trim();
    const applicantPassword = String(password || updatedApp?.password || 'Set during application').trim();

    if (applicantEmail) {
      const subject = 'APPLICATION UPDATE: ESPA Foundation';
      const text = normalizedStatus === 'Approved'
        ? `Dear ${applicantName},\n\nYour application to volunteer with ESPA Foundation has been approved.\n\nYou can now access the Portal on ESPA Digital Library using the following credentials:\n\nEmail: ${applicantEmail}\nPassword: ${applicantPassword}\n\nPlease keep your login credentials secure and do not share your password with anyone.\n\nFurther information regarding your volunteer role and responsibilities will be available through the ESPA Digital Library.\n\nWelcome to ESPA Foundation.\n\nESPA Foundation\nFrom Exclusion to Education.`
        : `Dear ${applicantName},\n\nThank you for your interest in volunteering with ESPA Foundation and for taking the time to submit your application.\n\nAfter careful review, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe appreciate your interest in supporting ESPA Foundation and encourage you to stay connected with us for future volunteer opportunities.\n\nThank you for your time and understanding.\n\nESPA Foundation\nFrom Exclusion to Education.`;

      try {
        await transporter.sendMail({
          from: '"ESPA Foundation" <foundationespa@gmail.com>',
          to: applicantEmail,
          subject,
          text,
        });
        emailSent = true;
      } catch (err) {
        console.error('Application email error:', err);
        emailError = err?.message || 'Email delivery failure';
      }
    }

    return res.status(200).json({ success: true, application: updatedApp, emailSent, emailError });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
