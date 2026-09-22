import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com',
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {

  // GET — retrieve volunteer applications
  if (req.method === 'GET') {
    if (!supabase) {
      return res.status(500).json({
        error: 'Supabase is not configured.'
      });
    }

    try {
      const { data, error } = await supabase
        .from('volunteer_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);

        return res.status(500).json({
          error: 'Failed to retrieve applications.'
        });
      }

      return res.status(200).json(data || []);

    } catch (error) {
      console.error('GET applications error:', error);

      return res.status(500).json({
        error: error.message
      });
    }
  }

  // POST / PATCH — approve or reject application
  if (req.method === 'PATCH' || req.method === 'POST') {

    const {
      status,
      name,
      email,
      password
    } = req.body || {};

    const rawStatus = (status || '')
      .toString()
      .trim()
      .toLowerCase();

    const normalizedStatus =
      rawStatus === 'approved'
        ? 'Approved'
        : rawStatus === 'rejected'
          ? 'Rejected'
          : (status || '');

    const applicantEmail = (email || '').trim();
    const applicantName = (name || 'Applicant').trim();
    const applicantPassword =
      (password || 'Set during application').trim();

    let emailSent = false;
    let emailError = null;

    if (
      applicantEmail &&
      (
        normalizedStatus === 'Approved' ||
        normalizedStatus === 'Rejected'
      )
    ) {

      const isApproved =
        normalizedStatus === 'Approved';

      const subject =
        'APPLICATION UPDATE: ESPA Foundation';

      const text = isApproved
        ? `Dear ${applicantName},

Your application to volunteer with ESPA Foundation has been approved.

You can now access the Portal on ESPA Digital Library using the following credentials:

Email: ${applicantEmail}
Password: ${applicantPassword}

Please keep your login credentials secure and do not share your password with anyone.

Further information regarding your volunteer role and responsibilities will be available through the ESPA Digital Library.

Welcome to ESPA Foundation. We look forward to having you contribute to our mission.

ESPA Foundation
From Exclusion to Education.`
        : `Dear ${applicantName},

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

      } catch (err) {

        console.error('Email error:', err);

        emailError =
          err?.message || 'Email delivery failure';
      }
    }

    return res.status(200).json({
      success: true,
      emailSent,
      emailError
    });
  }

  return res.status(405).json({
    error: 'Method Not Allowed'
  });
}