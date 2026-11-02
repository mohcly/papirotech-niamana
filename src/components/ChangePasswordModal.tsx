import React, { useState } from 'react';
import { KeyRound, Check, X } from 'lucide-react';
import { authService } from '../services/authService';
import { useSheet } from '../hooks/useSheet';

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSuccess }) => {
  useSheet(onClose);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPass !== confirmPass) {
      setError('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    const res = authService.changePassword(oldPass, newPass);
    if (res.success) {
      onSuccess('Mot de passe mis à jour avec succès.');
      onClose();
    } else {
      setError(res.error || 'Erreur lors du changement de mot de passe.');
    }
  };

  return (
    <div
      className="modal"
      onPointerDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" style={{ maxWidth: '420px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Sécurité du compte</div>
            <h2>Changer le mot de passe</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="sub">
          Définissez le mot de passe de votre choix pour sécuriser l'accès à Papirotech Niamana.
        </div>

        {error && (
          <div style={{
            background: 'var(--bad-tint)',
            border: '1px solid var(--bad)',
            color: 'var(--bad)',
            padding: '9px 11px',
            borderRadius: '8px',
            fontSize: '12.5px',
            marginBottom: '14px'
          }}>
            {error}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Mot de passe actuel</label>
            <input
              type="password"
              required
              value={oldPass}
              onChange={e => setOldPass(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div className="field">
            <label>Nouveau mot de passe</label>
            <input
              type="password"
              required
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              placeholder="Minimum 6 caractères"
            />
          </div>

          <div className="field">
            <label>Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              required
              value={confirmPass}
              onChange={e => setConfirmPass(e.target.value)}
              placeholder="••••••••••••"
            />
          </div>

          <div className="actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn">
              <Check size={15} />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
