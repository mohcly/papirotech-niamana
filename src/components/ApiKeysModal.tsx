import React, { useState } from 'react';
import { Copy, Check, X, Database } from 'lucide-react';
import { ApiConfig } from '../types';
import { storageService } from '../services/storageService';
import { useSheet } from '../hooks/useSheet';

interface ApiKeysModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ onClose, onSuccess }) => {
  useSheet(onClose);
  const [config, setConfig] = useState<ApiConfig>(storageService.getApiConfig());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedKey(label);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.saveApiConfig(config);
    onSuccess('Configuration des clés API enregistrée.');
    onClose();
  };

  const handleTestSupabase = async () => {
    setTestResult('Vérification en cours…');
    try {
      const client = storageService.getSupabaseClient();
      if (!client) {
        setTestResult('❌ Supabase non configuré (URL ou Anon Key manquante).');
        return;
      }
      const { error } = await client.from('creances').select('*', { count: 'exact', head: true });
      setTestResult(error ? `❌ ${error.message}` : '✅ Connexion Supabase active.');
    } catch (e: any) {
      setTestResult('❌ Impossible de joindre Supabase.');
    }
  };

  return (
    <div
      className="modal"
      onPointerDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Intégration & Services</div>
            <h2>Configuration Supabase & Vercel</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="sub">
          L'accès client utilise l'URL du projet et la clé publique anonyme (Anon Key), protégées par Row Level Security (RLS).
        </div>

        <form className="form" onSubmit={handleSave}>
          {/* Project Name */}
          <div className="field">
            <label>Nom du Projet</label>
            <input
              type="text"
              value={config.projectName}
              onChange={e => setConfig({ ...config, projectName: e.target.value })}
              placeholder="papirotech-niamana"
            />
          </div>

          {/* Supabase Project URL */}
          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>URL du Projet Supabase</span>
              {copiedKey === 'url' && <span style={{ color: 'var(--ok)', fontSize: '11px' }}>Copié !</span>}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={config.supabaseUrl}
                onChange={e => setConfig({ ...config, supabaseUrl: e.target.value })}
                placeholder="https://xxxxxx.supabase.co"
                style={{ fontFamily: 'var(--font-num)', fontSize: '13px' }}
              />
              <button
                type="button"
                className="icon-btn"
                title="Copier l'URL"
                onClick={() => copyToClipboard(config.supabaseUrl, 'url')}
              >
                {copiedKey === 'url' ? <Check size={15} color="var(--ok)" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Supabase Anon Key */}
          <div className="field">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Clé Publique Supabase (Anon Key / JWT)</span>
              {copiedKey === 'anon' && <span style={{ color: 'var(--ok)', fontSize: '11px' }}>Copié !</span>}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={config.supabaseAnonKey}
                onChange={e => setConfig({ ...config, supabaseAnonKey: e.target.value })}
                placeholder="eyJhbGciOi..."
                style={{ fontFamily: 'var(--font-num)', fontSize: '12px' }}
              />
              <button
                type="button"
                className="icon-btn"
                title="Copier la clé"
                onClick={() => copyToClipboard(config.supabaseAnonKey, 'anon')}
              >
                {copiedKey === 'anon' ? <Check size={15} color="var(--ok)" /> : <Copy size={15} />}
              </button>
            </div>
          </div>

          {/* Vercel Deployment Link */}
          <div className="field">
            <label>Identifiant du Déploiement Vercel</label>
            <input
              type="text"
              readOnly
              value={config.vercelProjectId}
              style={{ fontFamily: 'var(--font-num)', fontSize: '13px', background: 'var(--surface-3)' }}
            />
            <div style={{ fontSize: '11px', color: 'var(--fg-3)' }}>
              Domaine de production : <a href="https://papirotech-niamana.vercel.app" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>papirotech-niamana.vercel.app</a>
            </div>
          </div>

          {testResult && (
            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '12.5px',
              color: 'var(--fg-2)'
            }}>
              {testResult}
            </div>
          )}

          <div className="actions" style={{ justifyContent: 'space-between' }}>
            <button type="button" className="btn ghost" onClick={handleTestSupabase}>
              <Database size={15} /> Tester la connexion
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" className="btn ghost" onClick={onClose}>
                Fermer
              </button>
              <button type="submit" className="btn">
                <Check size={15} /> Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
