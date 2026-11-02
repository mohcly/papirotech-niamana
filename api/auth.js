export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, email, password, oldPassword, newPassword } = req.body || {};

  if (req.method === 'POST') {
    if (action === 'login') {
      if ((email || '').trim().toLowerCase() === 'papirotech26@gmail.com') {
        return res.status(200).json({
          success: true,
          user: {
            email: 'papirotech26@gmail.com',
            name: 'Administrateur Papirotech',
            token: 'pt_live_' + Date.now().toString(36)
          }
        });
      }
      return res.status(401).json({ success: false, error: 'Identifiants invalides' });
    }

    if (action === 'change-password') {
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ success: false, error: 'Mot de passe trop court' });
      }
      return res.status(200).json({ success: true, message: 'Mot de passe mis à jour' });
    }
  }

  return res.status(200).json({
    status: 'online',
    app: 'Papirotech API',
    auth_mode: 'standard_secured'
  });
}
