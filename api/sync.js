export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const PROJECT_NAME = 'papirotech-niamana';

  if (req.method === 'GET') {
    return res.status(200).json({
      project: PROJECT_NAME,
      connected: true,
      timestamp: new Date().toISOString()
    });
  }

  if (req.method === 'POST') {
    const payload = req.body || {};
    return res.status(200).json({
      success: true,
      syncedAt: new Date().toISOString(),
      recordsProcessed: Array.isArray(payload.creances) ? payload.creances.length : 0
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
