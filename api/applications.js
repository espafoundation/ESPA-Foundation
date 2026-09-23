import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_UL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

const ALLOWED_APPLICATION_FIELDS = new Set([
  'type', 'name', 'full_name', 'first_name', 'last_name', 'email',
  'phone', 'phone_country_code', 'phone_number',
  'whatsapp', 'whatsapp_country_code', 'whatsapp_number',
  'password', 'gender', 'dob', 'city', 'country',
  'volunteer_target', 'library_role', 'languages',
  'area_of_interest', 'availability', 'message', 'status',
  'email_verified', 'date', 'skills', 'institution', 'department',
  'current_status', 'social', 'socialMedia', 'experience',
  'organization', 'company', 'representative', 'designation',
  'website', 'partnership_type', 'partnershipType',
  'timeline_or_goals', 'proposal', 'motivation', 'interests',
  'influenceArea', 'profession', 'location', 'joinDate', 'dateAdded',
  'preferredCause', 'frequency', 'recognition'
]);

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
        console.error('Supabase applications GET error:', error);
        return res.status(500).json({ error: 'Failed to retrieve applications.', details: error.message });
      }
      return res.status(200).json(data || []);
    } catch (error) {
      console.error('GET applications error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Application ID is required.' });

    try {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .delete()
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Supabase application DELETE error:', error);
        return res.status(500).json({ error: 'Failed to delete application.', details: error.message });
      }
      if (!data) return res.status(404).json({ error: 'Application not found.' });
      return res.status(200).json({ success: true, application: data });
    } catch (error) {
      console.error('DELETE applications error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'PATCH' || req.method === 'POST') {
    const body = req.body || {};
    const { id, updates = {} } = body;
    if (!id) return res.status(400).json({ error: 'Application ID is required.' });

    const requestedUpdates = Object.keys(updates).length
      ? updates
      : Object.fromEntries(Object.entries(body).filter(([key]) => !['id', 'updates'].includes(key)));

    const cleanUpdates = {};
    for (const [key, value] of Object.entries(requestedUpdates)) {
      if (ALLOWED_APPLICATION_FIELDS.has(key)) cleanUpdates[key] = value;
    }

    if (cleanUpdates.status !== undefined) {
      const normalized = String(cleanUpdates.status).trim().toLowerCase();
      if (['approved', 'rejected', 'pending'].includes(normalized)) {
        cleanUpdates.status = normalized.charAt(0).toUpperCase() + normalized.slice(1);
      } else {
        return res.status(400).json({ error: 'Invalid application status.' });
      }
    }

    if (Object.keys(cleanUpdates).length === 0) {
      return res.status(400).json({ error: 'No editable application fields were supplied.' });
    }

    cleanUpdates.updated_at = new Date().toISOString();

    try {
      const { data: updatedApp, error: updateError } = await supabase
        .from('volunteer_applications')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase application update error:', updateError);
        return res.status(500).json({ error: 'Failed to update application.', details: updateError.message });
      }

      let emailSent = false;
      let emailError = null;
      const statusChanged = ['Approved', 'Rejected'].includes(cleanUpdates.status);

      if (statusChanged) {
        const applicantEmail = (updatedApp.email || '').trim();
        const applicantName = (updatedApp.name || 'Applicant').trim();
        const applicantPassword = (updatedApp.password || '').trim();
        const approved = cleanUpdates.status === 'Approved';
        const subject = 'APPLICATION UPDATE: ESPA Foundation';
        const text = approved
          ? `Dear ${applicantName},\n\nYour application to volunteer with ESPA Foundation has been approved.\n\nYou can now access the Portal on ESPA Digital Library using the following credentials:\n\nEmail: ${applicantEmail}\nPassword: ${applicantPassword}\n\nPlease keep your login credentials secure and do not share your password with anyone.\n\nESPA Foundation\nFrom Exclusion to Education.`
          : `Dear ${applicantName},\n\nThank you for your interest in volunteering with ESPA Foundation and for taking the time to submit your application.\n\nAfter careful review, we regret to inform you that we will not be moving forward with your application at this time.\n\nThank you for your time and understanding.\n\nESPA Foundation\nFrom Exclusion to Education.`;

        if (applicantEmail) {
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
      }

      return res.status(200).json({ success: true, application: updatedApp, emailSent, emailError });
    } catch (error) {
      console.error('PATCH applications error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
