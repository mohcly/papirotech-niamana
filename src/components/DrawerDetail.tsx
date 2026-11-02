import React, { useState } from 'react';
import { X, Check, Trash2, Archive, MessageSquare, Phone } from 'lucide-react';
import { Creance, Paiement } from '../types';
import { uid, todayISO } from '../services/storageService';
import { useSheet } from '../hooks/useSheet';

interface DrawerDetailProps {
  creance: Creance;
  onClose: () => void;
  onUpdate: (updated: Creance) => void;
  onDelete: (id: string) => void;
  onToast: (msg: string) => void;
}

const fmt = (n: number) => Math.round(n || 0).toLocaleString('fr-FR');
const MODES = ['Espèces', 'Orange Money', 'Wave', 'Mobicash', 'Virement', 'Autre'];

export const DrawerDetail: React.FC<DrawerDetailProps> = ({
  creance,
  onClose,
  onUpdate,
  onDelete,
  onToast
}) => {
  useSheet(onClose);
  const total = Math.round(+creance.montant || 0);
  const paye = (creance.paiements || []).reduce((acc, p) => acc + (+p.montant || 0), 0);
  const restant = Math.max(0, total - paye);
  const pct = total > 0 ? Math.min(100, Math.round((paye / total) * 100)) : 100;

  const [montantPay, setMontantPay] = useState<string>('');
  const [modePay, setModePay] = useState('Espèces');
  const [datePay, setDatePay] = useState(todayISO());

  const handleAddPayment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const amt = Math.round(+montantPay || 0);
    if (amt <= 0) {
      onToast('Veuillez saisir un montant supérieur à 0.');
      return;
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      (navigator as any).vibrate?.(10);
    }

    const newPayment: Paiement = {
      id: uid(),
      date: datePay,
      montant: amt,
      mode: modePay
    };

    const newJournal = (creance.journal || []).slice();
    newJournal.push({
      t: new Date().toISOString(),
      txt: `Règlement de ${fmt(amt)} FCFA (${modePay}) enregistré.`
    });

    const updated: Creance = {
      ...creance,
      paiements: [...(creance.paiements || []), newPayment],
      journal: newJournal.slice(-50)
    };

    onUpdate(updated);
    setMontantPay('');
    onToast(`Règlement de ${fmt(amt)} FCFA enregistré avec succès.`);
  };

  const handleRemovePayment = (payId: string) => {
    const pToRemove = creance.paiements.find(p => p.id === payId);
    const updatedPayments = creance.paiements.filter(p => p.id !== payId);
    const newJournal = (creance.journal || []).slice();
    newJournal.push({
      t: new Date().toISOString(),
      txt: `Annulation du règlement de ${fmt(pToRemove?.montant || 0)} FCFA.`
    });

    const updated: Creance = {
      ...creance,
      paiements: updatedPayments,
      journal: newJournal.slice(-50)
    };

    onUpdate(updated);
    onToast('Règlement annulé.');
  };

  const handleToggleArchive = () => {
    const nextArchived = !creance.archived;
    const newJournal = (creance.journal || []).slice();
    newJournal.push({
      t: new Date().toISOString(),
      txt: nextArchived ? 'Ligne archivée.' : 'Ligne réactivée du registre.'
    });

    const updated: Creance = {
      ...creance,
      archived: nextArchived,
      journal: newJournal.slice(-50)
    };

    onUpdate(updated);
    onToast(nextArchived ? 'Créance archivée.' : 'Créance réactivée.');
    onClose();
  };

  const generateReminder = () => {
    const text = `Bonjour ${creance.nom}, sauf erreur de notre part, votre solde de ${fmt(restant)} FCFA chez Papirotech Niamana reste en attente de règlement. Merci de régulariser par Espèces, Orange Money ou Wave dès que possible. Cordialement.`;
    navigator.clipboard?.writeText(text);
    onToast('Message de relance copié dans le presse-papier !');
  };

  return (
    <>
      <div
        className="scrim"
        onPointerDown={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <aside className="drawer">
        {/* Header */}
        <div className="dhead">
          <div className="t">
            <div className="eyebrow" style={{ color: 'var(--accent)' }}>Détail de la créance</div>
            <h2>{creance.nom}</h2>
            <div className="s">
              {creance.tel ? <span>Tél : {creance.tel} • </span> : null}
              {creance.sens === 'fournisseur' ? 'Fournisseur' : 'Client'}
              {creance.cat ? ` • ${creance.cat}` : ''}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer" style={{ minWidth: '44px', minHeight: '44px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="dbody">
          {/* Summary grid */}
          <div className="money-grid">
            <div className="money">
              <div className="k">Total Dû</div>
              <div className="v">{fmt(total)} F</div>
            </div>
            <div className="money">
              <div className="k">Encaissé</div>
              <div className="v" style={{ color: 'var(--ok)' }}>{fmt(paye)} F</div>
            </div>
            <div className="money">
              <div className="k">Reste</div>
              <div className="v" style={{ color: restant > 0 ? 'var(--bad)' : 'var(--ok)' }}>
                {fmt(restant)} F
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--fg-3)' }}>
              <span>Recouvrement : {pct}%</span>
              <span>{restant <= 0 ? 'Soldé' : `${fmt(restant)} F restant`}</span>
            </div>
            <div className="prog">
              <i style={{ width: `${pct}%`, background: restant <= 0 ? 'var(--ok)' : 'var(--accent)' }} />
            </div>
          </div>

          {/* Payment input section */}
          {restant > 0 && (
            <div className="sect">
              <h3>Encaisser un règlement</h3>
              <form onSubmit={handleAddPayment} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="field">
                  <label>Montant du versement (FCFA)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Ex: 25000"
                    value={montantPay}
                    onChange={e => setMontantPay(e.target.value.replace(/[^\d]/g, ''))}
                  />
                  {/* Quick amount buttons */}
                  <div className="quickamt">
                    <button type="button" onClick={() => setMontantPay('5000')}>+5 000</button>
                    <button type="button" onClick={() => setMontantPay('10000')}>+10 000</button>
                    <button type="button" onClick={() => setMontantPay('25000')}>+25 000</button>
                    <button type="button" onClick={() => setMontantPay(String(restant))}>Tout solder ({fmt(restant)})</button>
                  </div>
                </div>

                <div className="grid2">
                  <div className="field">
                    <label>Mode de paiement</label>
                    <select value={modePay} onChange={e => setModePay(e.target.value)}>
                      {MODES.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input type="date" value={datePay} onChange={e => setDatePay(e.target.value)} />
                  </div>
                </div>

                <button type="submit" className="btn ok" style={{ justifyContent: 'center', marginTop: '4px', minHeight: '44px' }}>
                  <Check size={16} />
                  Valider le règlement
                </button>
              </form>
            </div>
          )}

          {/* Payment History */}
          <div className="sect">
            <h3>Historique des règlements ({(creance.paiements || []).length})</h3>
            {(creance.paiements || []).length === 0 ? (
              <div className="nothing">Aucun versement n'a encore été enregistré.</div>
            ) : (
              <div className="phist">
                {creance.paiements.map(p => (
                  <div key={p.id} className="p">
                    <div className="d">{p.date.split('-').reverse().join('/')}</div>
                    <div className="m">{p.mode}</div>
                    <div className="a">{fmt(p.montant)} F</div>
                    <button
                      type="button"
                      className="x"
                      title="Supprimer ce paiement"
                      onClick={() => handleRemovePayment(p.id)}
                      style={{ minWidth: '44px', minHeight: '44px' }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Communication & Reminder */}
          {restant > 0 && (
            <div className="sect">
              <h3>Relance client</h3>
              <div className="drow">
                <button type="button" className="btn ghost" onClick={generateReminder} style={{ minHeight: '44px' }}>
                  <MessageSquare size={16} />
                  Copier le texte de relance
                </button>
                {creance.tel && (
                  <a href={`tel:${creance.tel}`} className="btn ghost" style={{ textDecoration: 'none', minHeight: '44px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={16} />
                    Appeler {creance.tel}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="sect" style={{ marginTop: 'auto', borderTop: '1px solid var(--line)', paddingTop: '16px' }}>
            <div className="drow" style={{ justifyContent: 'space-between' }}>
              <button type="button" className="btn ghost" onClick={handleToggleArchive} style={{ minHeight: '44px' }}>
                <Archive size={16} />
                {creance.archived ? 'Désarchiver' : 'Archiver'}
              </button>
              <button
                type="button"
                className="btn danger"
                style={{ minHeight: '44px' }}
                onClick={() => {
                  if (confirm(`Confirmez-vous la suppression définitive de ${creance.nom} ?`)) {
                    onDelete(creance.id);
                    onToast('Créance supprimée définitivement.');
                    onClose();
                  }
                }}
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
