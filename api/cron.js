import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_UL || process.env.VITE_SUPABASE_URL;
// Use Service Role Key if available to bypass RLS, otherwise fallback to anon
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase credentials missing.' });
  }

  try {
    // Insert a daily activity log into the hidden 'keepalive_logs' table
    const { error } = await supabase
      .from('keepalive_logs')
      .insert([{ message: 'Daily keepalive ping' }]);
    
    if (error) {
      console.error('Keepalive ping error:', error);
      return res.status(500).json({ 
        error: 'Failed to log activity to database', 
        details: error.message,
        hint: "Check if the table is named exactly 'keepalive_logs' (no spaces) in the database, and check RLS policies."
      });
    }
    
    return res.status(200).json({ success: true, message: 'Supabase daily keepalive logged successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
