const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  const jobId = req.query.job_id;
  if (!jobId) {
    return res.status(400).json({ error: 'Missing job_id parameter' });
  }

  try {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('content_generation_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({ job: data });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}; 