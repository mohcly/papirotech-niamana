import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Creance } from '../types';
import { uid, todayISO } from '../services/storageService';
import { useSheet } from '../hooks/useSheet';

interface NewCreanceModalProps {
  onClose: () => void;
  onSave: (c: Creance) => void;
}

export const NewCreanceModal: React.FC<NewCreanceModalProps> = ({ onClose, onSave }) => {
  useSheet(onClose);
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [sens, setSens] = useState<'client' | 'fournisseur'>('client');
  const [tel, setTel] = useState('');
  const [echeance, setEcheance] = useState('');
  const [cat, setCat] = useState('Général');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNom = nom.trim();
    const numMontant = Math.round(+montant || 0);

    if (!cleanNom || numMontant <= 0) return;

    const now = new Date().toISOString();
    const newItem: Creance = {
      id: uid(),
      nom: cleanNom,
      montant: numMontant,
      sens,
      tel: tel.trim() || undefined,
      echeance: echeance || undefined,
      cat: cat.trim() || undefined,
      note: note.trim() || undefined,
      archived: false,
      paiements: [],
      createdAt: now,
      journal: [
        {
          t: now,
          txt: `Création de la ligne — ${numMontant.toLocaleString('fr-FR')} FCFA`
        }
      ]
    };

    onSave(newItem);
    onClose();
  };

  return (
    <div
      className="modal"
      onPointerDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Nouveau dossier</div>
            <h2>Ajouter une ligne au registre</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {/* Sens toggle */}
          <div className="seg">
            <button
              type="button"
              aria-pressed={sens === 'client'}
              onClick={() => setSens('client')}
            >
              Créance Client (on nous doit)
            </button>
            <button
              type="button"
              aria-pressed={sens === 'fournisseur'}
              onClick={() => setSens('fournisseur')}
            >
              Dette Fournisseur (nous devons)
            </button>
          </div>

          <div className="field">
            <label>Nom du client ou de l'entreprise *</label>
            <input
              type="text"
              required
              autoFocus
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Ex: Mady Djenepo"
            />
          </div>

          <div className="grid2">
            <div className="field">
              <label>Montant initial (FCFA) *</label>
              <input
                type="number"
                min="100"
                required
                value={montant}
                onChange={e => setMontant(e.target.value)}
                placeholder="Ex: 150000"
              />
            </div>
            <div className="field">
              <label>Téléphone</label>
              <input
                type="tel"
                value={tel}
                onChange={e => setTel(e.target.value)}
                placeholder="Ex: +223 77 00 00 00"
              />
            </div>
          </div>

          <div className="grid2">
            <div className="field">
              <label>Échéance prévue</label>
              <input
                type="date"
                value={echeance}
                onChange={e => setEcheance(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Catégorie</label>
              <input
                type="text"
                value={cat}
                onChange={e => setCat(e.target.value)}
                placeholder="Ex: Vente, Prestation..."
              />
            </div>
          </div>

          <div className="field">
            <label>Observation / Note</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Détails sur la facture, numéro de bon, accords..."
            />
          </div>

          <div className="actions">
            <button type="button" className="btn ghost" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn">
              <Check size={15} />
              Enregistrer au registre
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
