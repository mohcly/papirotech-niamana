import React, { useState } from 'react';
import { X, Plus, Trash2, Check } from 'lucide-react';
import { Compte } from '../types';
import { useSheet } from '../hooks/useSheet';

interface ManageComptesModalProps {
  comptes: Compte[];
  onClose: () => void;
  onSave: (comptes: Compte[]) => void;
}

export const ManageComptesModal: React.FC<ManageComptesModalProps> = ({
  comptes: initialComptes,
  onClose,
  onSave
}) => {
  useSheet(onClose);
  const [list, setList] = useState<Compte[]>(initialComptes);
  const [newNom, setNewNom] = useState('');

  const handleAdd = () => {
    if (!newNom.trim()) return;
    const k = 'c_' + Math.random().toString(36).substring(2, 7);
    setList([...list, { k, n: newNom.trim() }]);
    setNewNom('');
  };

  const handleRemove = (index: number) => {
    if (list.length <= 1) {
      alert('Il faut conserver au moins un compte de trésorerie.');
      return;
    }
    setList(list.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(list);
    onClose();
  };

  return (
    <div
      className="modal"
      onPointerDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" style={{ maxWidth: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Trésorerie</div>
            <h2>Comptes du fonds de roulement</h2>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer">
            <X size={16} />
          </button>
        </div>

        <div className="sub">
          Personnalisez la liste des comptes financiers suivis au quotidien.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {list.map((c, i) => (
            <div key={c.k} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={c.n}
                onChange={e => {
                  const copy = [...list];
                  copy[i].n = e.target.value;
                  setList(copy);
                }}
                style={{ flex: 1, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '6px' }}
              />
              <button
                type="button"
                className="icon-btn"
                title="Supprimer ce compte"
                onClick={() => handleRemove(i)}
                style={{ color: 'var(--bad)', minWidth: '44px', minHeight: '44px' }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Nouveau compte (ex: UBA, Ecobank...)"
            value={newNom}
            onChange={e => setNewNom(e.target.value)}
            style={{ flex: 1, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: '6px' }}
          />
          <button type="button" className="btn ghost" onClick={handleAdd} style={{ minHeight: '44px' }}>
            <Plus size={15} /> Ajouter
          </button>
        </div>

        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            Annuler
          </button>
          <button type="button" className="btn" onClick={handleSave}>
            <Check size={15} /> Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};
