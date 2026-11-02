import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import { UserSession } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = authService.login(email, password);
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        setError(res.error || 'Erreur de connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal" style={{ background: 'rgba(15, 20, 26, 0.88)' }}>
      <div className="sheet" style={{ maxWidth: '440px', padding: '28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'var(--accent-tint)',
            border: '1px solid var(--accent-line)',
            color: 'var(--accent)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px'
          }}>
            <ShieldCheck size={28} />
          </div>
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>Accès Sécurisé</div>
          <h2 style={{ marginTop: '4px' }}>Connexion Papirotech Niamana</h2>
          <div className="sub" style={{ margin: '6px 0 0' }}>
            Gestion confidentielle des créances et fonds de roulement
          </div>
        </div>

        {error && (
          <div style={{
            background: 'var(--bad-tint)',
            border: '1px solid var(--bad)',
            color: 'var(--bad)',
            padding: '10px 12px',
            borderRadius: '8px',
            fontSize: '12.5px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} /> Adresse Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre.email@exemple.com"
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={13} /> Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              autoComplete="current-password"
            />
          </div>

          <div className="actions" style={{ marginTop: '12px' }}>
            <button
              type="submit"
              className="btn"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
            >
              <span>{loading ? 'Connexion en cours…' : 'Accéder au registre'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
