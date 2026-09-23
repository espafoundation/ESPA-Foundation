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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const {
    id, name, full_name, first_name, last_name, email,
    phone, phone_country_code, phone_number,
    whatsapp, whatsapp_country_code, whatsapp_number,
    password, gender, dob, city, country,
    volunteer_target, library_role, languages,
    area_of_interest, availability, message,
    date, status, emailVerified,
  } = req.body || {};

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Supabase is not configured.' });
  }

  try {
    const application = {
      id: id || `app_vol_${Date.now()}`,
      type: 'volunteer',
      name: String(name).trim(),
      full_name: full_name || name,
      first_name: first_name || '',
      last_name: last_name || '',
      email: String(email).trim().toLowerCase(),
      phone: phone || '',
      phone_country_code: phone_country_code || '',
      phone_number: phone_number || '',
      whatsapp: whatsapp || '',
      whatsapp_country_code: whatsapp_country_code || '',
      whatsapp_number: whatsapp_number || '',
      password: password || '',
      gender: gender || '',
      dob: dob || null,
      city: city || '',
      country: country || '',
      volunteer_target: volunteer_target || '',
      library_role: library_role || '',
      languages: Array.isArray(languages) ? languages : [],
      area_of_interest: area_of_interest || '',
      availability: availability || '',
      message: message || '',
      status: status || 'Pending',
      email_verified: emailVerified === true || emailVerified === 'true',
      created_at: date || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert makes retries safe and prevents duplicate submissions for the same application ID.
    const { data, error: dbError } = await supabase
      .from('volunteer_applications')
      .upsert(application, { onConflict: 'id' })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase volunteer application error:', dbError);
      return res.status(500).json({
        error: 'Failed to save volunteer application.',
        details: dbError.message,
      });
    }

    let emailSent = false;
    let emailError = null;

    try {
      await transporter.sendMail({
        from: '"ESPA Foundation" <foundationespa@gmail.com>',
        to: 'foundationespa@gmail.com',
        replyTo: email,
        subject: `New Volunteer Application from ${name}`,
        text: `New Volunteer Application\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || ''}\nWhatsApp: ${whatsapp || ''}\nGender: ${gender || ''}\nDate of Birth: ${dob || ''}\nCity: ${city || ''}\nCountry: ${country || ''}\nVolunteer Target: ${volunteer_target || ''}\nLibrary Role: ${library_role || ''}\nLanguages: ${Array.isArray(languages) ? languages.join(', ') : languages || ''}\nArea of Interest: ${area_of_interest || ''}\nAvailability: ${availability || ''}\nMotivation:\n${message || ''}`,
      });
      emailSent = true;
    } catch (emailErr) {
      console.error('Volunteer notification email error:', emailErr);
      emailError = emailErr?.message || 'Email delivery failure';
    }

    return res.status(200).json({ success: true, application: data, emailSent, emailError });
  } catch (error) {
    console.error('Volunteer application error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to process volunteer application.' });
  }
}
