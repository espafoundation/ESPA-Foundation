export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Username or email, and password are required.' });
  }

  const cleanInput = String(email).trim().toLowerCase();
  const inputPassword = String(password);

  // 1. Dedicated Developer / Master Admin configuration from environment variables
  const masterEmail = (process.env.MASTER_ADMIN_EMAIL || process.env.DEVELOPER_EMAIL || '').trim().toLowerCase();
  const masterPassword = process.env.MASTER_ADMIN_PASSWORD || process.env.DEVELOPER_PASSWORD || '';
  const masterName = process.env.MASTER_ADMIN_NAME || process.env.DEVELOPER_NAME || 'Master Developer Admin';

  // 2. Organization Admin configuration from environment variables
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@espafoundation.social').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'Admin';

  // Check Developer / Master Admin credentials
  const isMasterMatch = Boolean(masterPassword && (
    cleanInput === masterEmail ||
    cleanInput === 'developer' ||
    cleanInput === 'master' ||
    cleanInput === 'masteradmin' ||
    (masterEmail && cleanInput === masterEmail.split('@')[0])
  ) && inputPassword === masterPassword);

  // Check General Admin credentials
  const isAdminMatch = Boolean(adminPassword && (
    cleanInput === adminEmail ||
    cleanInput === 'admin' ||
    (adminEmail && cleanInput === adminEmail.split('@')[0])
  ) && inputPassword === adminPassword);

  if (isMasterMatch) {
    return res.status(200).json({
      success: true,
      user: {
        id: 'A00',
        email: masterEmail || cleanInput,
        name: masterName,
        role: 'Admin',
        isMasterAdmin: true,
      },
      token: 'master-admin-session-token',
    });
  }

  if (isAdminMatch) {
    return res.status(200).json({
      success: true,
      user: {
        id: 'A01',
        email: adminEmail,
        name: adminName,
        role: 'Admin',
        isMasterAdmin: true,
      },
      token: 'admin-session-token',
    });
  }

  return res.status(401).json({ error: 'Invalid credentials. Please verify email/username and password.' });
}
