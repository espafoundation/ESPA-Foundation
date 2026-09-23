export default async function handler(req, res) {
  res.setHeader('Set-Cookie', 'espa_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
