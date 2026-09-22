import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com', 
    pass: process.env.EMAIL_PASS || 'xzxp ilzw hiwu sjcr' 
  },
});

export default async function handler(req, res) {
  if (req.method === 'PATCH' || req.method === 'POST') {
    const { status, name, email, password } = req.body || {};
    const rawStatus = (status || '').toString().trim().toLowerCase();
    const normalizedStatus = rawStatus === 'approved' 
      ? 'Approved' 
      : (rawStatus === 'rejected' ? 'Rejected' : (status || ''));

    const applicantEmail = (email || '').trim();
    const applicantName = (name || 'Applicant').trim();
    const applicantPassword = (password || 'Set during application').trim();

    let emailSent = false;
    let emailError = null;

    if (applicantEmail && (normalizedStatus === 'Approved' || normalizedStatus === 'Rejected')) {
      const isApproved = normalizedStatus === 'Approved';
      const subject = 'APPLICATION UPDATE: ESPA Foundation';

      const text = isApproved
        ? `Dear ${applicantName},\n\nYour application to volunteer with ESPA Foundation has been approved.\n\nYou can now access the Portal on ESPA Digital Library using the following credentials:\n\nEmail: ${applicantEmail}\nPassword: ${applicantPassword}\n\nPlease keep your login credentials secure and do not share your password with anyone.\n\nFurther information regarding your volunteer role and responsibilities will be available through the ESPA Digital Library.\n\nWelcome to ESPA Foundation. We look forward to having you contribute to our mission.\n\nESPA Foundation\nFrom Exclusion to Education.`
        : `Dear ${applicantName},\n\nThank you for your interest in volunteering with ESPA Foundation and for taking the time to submit your application.\n\nAfter careful review, we regret to inform you that we will not be moving forward with your application at this time.\n\nWe appreciate your interest in supporting ESPA Foundation and encourage you to stay connected with us for future volunteer opportunities.\n\nThank you for your time and understanding.\n\nESPA Foundation\nFrom Exclusion to Education.`;

      try {
        await transporter.sendMail({
          from: '"ESPA Foundation" <foundationespa@gmail.com>',
          to: applicantEmail,
          subject,
          text
        });
        emailSent = true;
      } catch (err) {
        emailError = err?.message || 'Email delivery failure';
      }
    }

    return res.status(200).json({ success: true, emailSent, emailError });
  }

  return res.status(405).json({ error: 'Method Not Allowed' });
}
