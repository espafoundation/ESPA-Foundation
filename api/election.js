import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }) : null;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foundationespa@gmail.com',
    pass: process.env.EMAIL_PASS || process.env.EMAIL_APP_PASSWORD,
  },
});

// Election Endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { 
    voterName, 
    president, 
    vicePresident, 
    generalSecretary, 
    jointSecretary, 
    treasurer, 
    executiveMember1, 
    executiveMember2 
  } = req.body;
  
  try {
    if (supabase) {
      const votes = [
        { voter_name: voterName, title: 'President', nominee_name: president },
        { voter_name: voterName, title: 'Vice President', nominee_name: vicePresident },
        { voter_name: voterName, title: 'General Secretary', nominee_name: generalSecretary },
        { voter_name: voterName, title: 'Joint Secretary', nominee_name: jointSecretary },
        { voter_name: voterName, title: 'Treasurer', nominee_name: treasurer },
        { voter_name: voterName, title: 'Executive Member 1', nominee_name: executiveMember1 },
        { voter_name: voterName, title: 'Executive Member 2', nominee_name: executiveMember2 }
      ];
      const { error: dbError } = await supabase
        .from('election_votes')
        .insert(votes);
      if (dbError) {
        console.error('Supabase error (election):', dbError);
        return res.status(500).json({ error: 'Database error: ' + dbError.message });
      }
    } else {
      return res.status(500).json({ error: 'Supabase credentials missing on server' });
    }

    await transporter.sendMail({
      from: '"ESPA Website" <foundationespa@gmail.com>',
      to: 'foundationespa@gmail.com',
      subject: `New Election Ballot Submitted by ${voterName}`,
      text: `Voter Name: ${voterName}\n\nPresident: ${president}\nVice President: ${vicePresident}\nGeneral Secretary: ${generalSecretary}\nJoint Secretary: ${jointSecretary}\nTreasurer: ${treasurer}\nExecutive Member 1: ${executiveMember1}\nExecutive Member 2: ${executiveMember2}`,
      html: `
        <h3>New Election Ballot</h3>
        <p><strong>Voter Name:</strong> ${voterName}</p>
        <hr />
        <p><strong>President:</strong> ${president}</p>
        <p><strong>Vice President:</strong> ${vicePresident}</p>
        <p><strong>General Secretary:</strong> ${generalSecretary}</p>
        <p><strong>Joint Secretary:</strong> ${jointSecretary}</p>
        <p><strong>Treasurer:</strong> ${treasurer}</p>
        <p><strong>Executive Member 1:</strong> ${executiveMember1}</p>
        <p><strong>Executive Member 2:</strong> ${executiveMember2}</p>
      `
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Service error: ' + error.message });
  }
}
