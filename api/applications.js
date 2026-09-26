import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_UL ||
  process.env.VITE_SUPABASE_URL;

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

const TABLES = {
  volunteer: 'volunteer_applications',
  ambassador: 'ambassador_applications',
  partner: 'partner_proposals',
};

const normalizeStatus = (value) => {
  const s = String(value || '').trim().toLowerCase();
  if (s === 'approved') return 'Approved';
  if (s === 'rejected') return 'Rejected';
  return value || 'Pending';
};

async function sendDecisionEmail({ to, name, password, status }) {
  if (!process.env.EMAIL_USER || !(process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD)) {
    throw new Error('EMAIL_USER or EMAIL_PASS is missing in Vercel Production environment.');
  }

  const normalizedStatus = normalizeStatus(status);
  const applicantName = String(name || 'Applicant').trim();
  const applicantEmail = String(to || '').trim();

  if (!applicantEmail) {
    throw new Error('Applicant email address is missing.');
  }

  const approved = normalizedStatus === 'Approved';

  const subject = approved
    ? 'APPLICATION APPROVED: ESPA Foundation'
    : 'APPLICATION UPDATE: ESPA Foundation';

  const text = approved
    ? `Dear ${applicantName},

Your application to volunteer with ESPA Foundation has been approved.

You can now access the Portal on ESPA Digital Library using the following credentials:

Email: ${applicantEmail}
Password: ${password || 'Set during application'}

Please keep your login credentials secure and do not share your password with anyone.

Further information regarding your volunteer role and responsibilities will be available through the ESPA Digital Library.

Welcome to ESPA Foundation. We look forward to having you contribute to our mission.

ESPA Foundation
From Exclusion to Education`
    : `Dear ${applicantName},

Thank you for your interest in volunteering with ESPA Foundation and for taking the time to submit your application.

After careful review, we regret to inform you that we will not be moving forward with your application at this time.

We appreciate your interest in supporting ESPA Foundation and encourage you to stay connected with us for future volunteer opportunities.

Thank you for your time and understanding.

ESPA Foundation
From Exclusion to Education`;

  const info = await transporter.sendMail({
    from: `"ESPA Foundation" <${process.env.EMAIL_USER}>`,
    to: applicantEmail,
    subject,
    text,
  });

  return info;
}

async function getTableRows(table) {
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select('*');
  if (error) {
    console.warn(`Applications GET: could not read ${table}:`, error.message);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

function mapApplication(row, type) {
  if (!row) return null;
  return {
    ...row,
    id: row.id || `${type}_${row.email || row.created_at || Date.now()}`,
    type,
    status: normalizeStatus(row.status),
    name:
      row.name ||
      row.full_name ||
      `${row.first_name || ''} ${row.last_name || ''}`.trim() ||
      row.organization ||
      'Applicant',
    email: row.email || '',
    date: row.date || row.created_at || row.createdAt || null,
  };
}

async function getApplications() {
  if (!supabase) return [];

  const [volunteers, ambassadors, partners] = await Promise.all([
    getTableRows(TABLES.volunteer),
    getTableRows(TABLES.ambassador),
    getTableRows(TABLES.partner),
  ]);

  return [
    ...volunteers.map((row) => mapApplication(row, 'volunteer')),
    ...ambassadors.map((row) => mapApplication(row, 'ambassador')),
    ...partners.map((row) => mapApplication(row, 'partner')),
  ];
}

async function updateApplicationStatus({ id, email, type, status }) {
  if (!supabase) return null;

  const normalizedType = String(type || '').trim().toLowerCase();
  const tables = normalizedType && TABLES[normalizedType]
    ? [normalizedType]
    : Object.keys(TABLES);

  for (const currentType of tables) {
    const table = TABLES[currentType];

    // Prefer application ID when available.
    if (id) {
      const byId = await supabase
        .from(table)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .maybeSingle();

      if (!byId.error && byId.data) {
        return mapApplication(byId.data, currentType);
      }
    }

    // Fall back to applicant email. This also supports tables whose
    // application records were created without the same ID.
    if (email) {
      const byEmail = await supabase
        .from(table)
        .update({ status, updated_at: new Date().toISOString() })
        .eq('email', String(email).trim().toLowerCase())
        .select('*')
        .maybeSingle();

      if (!byEmail.error && byEmail.data) {
        return mapApplication(byEmail.data, currentType);
      }
    }
  }

  return null;
}

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return res.status(200).json(await getApplications());
    }

    if (req.method === 'PATCH') {
      const body = req.body || {};
      const id = body.id || body.updates?.id;
      const status = normalizeStatus(body.status || body.updates?.status);
      const email = String(body.email || body.updates?.email || '').trim().toLowerCase();
      const type = String(body.type || body.updates?.type || '').trim().toLowerCase();
      const name =
        body.name ||
        body.updates?.name ||
        `${body.first_name || ''} ${body.last_name || ''}`.trim() ||
        'Applicant';
      const password = body.password || body.updates?.password || '';

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be Approved or Rejected.' });
      }

      if (!id && !email) {
        return res.status(400).json({ error: 'Application ID or applicant email is required.' });
      }

      // The email is intentionally sent on EVERY Approved/Rejected request.
      // This means Approved -> Approve again and Rejected -> Reject again
      // both dispatch a fresh email.
      let updatedApplication = null;
      try {
        updatedApplication = await updateApplicationStatus({
          id,
          email,
          type,
          status,
        });
      } catch (dbError) {
        console.error('Application status update warning:', dbError);
      }

      const applicantEmail = updatedApplication?.email || email;
      const applicantName = updatedApplication?.name || name;
      const applicantPassword = updatedApplication?.password || password;

      let emailSent = false;
      let emailError = null;

      try {
        await sendDecisionEmail({
          to: applicantEmail,
          name: applicantName,
          password: applicantPassword,
          status,
        });
        emailSent = true;
      } catch (mailError) {
        emailError = mailError?.message || 'Email delivery failed.';
        console.error('Application decision email failed:', mailError);
      }

      if (!emailSent) {
        return res.status(502).json({
          success: false,
          application: updatedApplication,
          emailSent: false,
          emailError,
          error: `Application status was processed, but the email could not be sent: ${emailError}`,
        });
      }

      return res.status(200).json({
        success: true,
        application: updatedApplication || {
          id,
          type,
          name: applicantName,
          email: applicantEmail,
          password: applicantPassword,
          status,
        },
        emailSent: true,
        emailError: null,
      });
    }

    if (req.method === 'POST') {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase is not configured.' });
      }

      const body = req.body || {};
      const type = String(body.type || 'volunteer').trim().toLowerCase();
      const table = TABLES[type];

      if (!table) {
        return res.status(400).json({ error: 'Unsupported application type.' });
      }

      const payload = {
        ...body,
        status: normalizeStatus(body.status || 'Pending'),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(table)
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({
        success: true,
        application: mapApplication(data, type),
      });
    }

    if (req.method === 'DELETE') {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase is not configured.' });
      }

      const body = req.body || {};
      const id = body.id;
      const email = String(body.email || '').trim().toLowerCase();
      const type = String(body.type || '').trim().toLowerCase();
      const types = type && TABLES[type] ? [type] : Object.keys(TABLES);

      for (const currentType of types) {
        const table = TABLES[currentType];
        const query = supabase.from(table).delete();

        const result = id
          ? await query.eq('id', id).select('*').maybeSingle()
          : email
            ? await query.eq('email', email).select('*').maybeSingle()
            : null;

        if (result?.data) {
          return res.status(200).json({
            success: true,
            application: mapApplication(result.data, currentType),
          });
        }
      }

      return res.status(404).json({ error: 'Application not found.' });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error) {
    console.error('Applications API error:', error);
    return res.status(500).json({
      error: error?.message || 'Internal server error.',
    });
  }
}
