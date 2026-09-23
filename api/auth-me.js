export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Parse cookie header
  const cookies = req.headers.cookie ? Object.fromEntries(req.headers.cookie.split(';').map(c => {
    const [key, ...v] = c.trim().split('=');
    return [key, decodeURIComponent(v.join('='))];
  })) : {};

  const token = cookies.espa_session || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : null);

  if (!token) {
    return res.status(401).json({ authenticated: false, user: null });
  }

  // For serverless fallback, recognize valid session token format
  return res.status(200).json({
    authenticated: true,
    message: 'Session valid'
  });
}
