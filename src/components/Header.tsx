import React from 'react';
import { Moon, Sun, Key, Lock, LogOut, Plus, UploadCloud, Download } from 'lucide-react';
import { UserSession } from '../types';

interface HeaderProps {
  user: UserSession;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenNew: () => void;
  onOpenKeys: () => void;
  onOpenPassword: () => void;
  onLogout: () => void;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  onToggleTheme,
  onOpenNew,
  onOpenKeys,
  onOpenPassword,
  onLogout,
  onExport
}) => {
  const triggerPickFile = () => {
    window.dispatchEvent(new Event('papirotech:pick-file'));
  };

  return (
    <header className="top">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <img
          src="/favicon.svg"
          alt="Papirotech Logo"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            boxShadow: '0 4px 16px rgba(227, 171, 69, 0.25)',
            border: '1px solid rgba(227, 171, 69, 0.35)',
            flexShrink: 0
          }}
        />
        <div>
          <div className="eyebrow">Papirotech Niamana</div>
          <h1 id="h1">Registre des créances & Trésorerie</h1>
          <div className="sub">
            Suivi des créances clients, des règlements et du fonds de roulement journalier.
          </div>
        </div>
      </div>

      <div className="top-actions">
        {/* Mobile-friendly Import Button */}
        <button
          className="btn ghost"
          onClick={triggerPickFile}
          title="Importer un fichier Excel, CSV ou JSON"
        >
          <UploadCloud size={16} />
          <span>Importer</span>
        </button>

        {/* Theme toggle */}
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
          aria-label="Changer de thème"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Export data */}
        <button
          className="icon-btn"
          onClick={onExport}
          title="Exporter la sauvegarde (JSON)"
          aria-label="Exporter"
        >
          <Download size={17} />
        </button>

        {/* API & Supabase Keys */}
        <button
          className="icon-btn"
          onClick={onOpenKeys}
          title="Clés API & Projet Supabase"
          aria-label="Clés API"
        >
          <Key size={17} />
        </button>

        {/* Change password */}
        <button
          className="icon-btn"
          onClick={onOpenPassword}
          title="Changer le mot de passe"
          aria-label="Mot de passe"
        >
          <Lock size={17} />
        </button>

        {/* Logout */}
        <button
          className="icon-btn"
          onClick={onLogout}
          title="Se déconnecter"
          aria-label="Déconnexion"
        >
          <LogOut size={17} />
        </button>

        {/* New debt */}
        <button className="btn" onClick={onOpenNew}>
          <Plus size={16} />
          <span>Nouvelle ligne</span>
        </button>
      </div>
    </header>
  );
};
