import React from 'react';
import { Creance } from '../types';

interface KpiBarProps {
  creances: Creance[];
}

const fmt = (n: number) => Math.round(n || 0).toLocaleString('fr-FR');
const fcfa = (n: number) => fmt(n) + ' FCFA';

export const KpiBar: React.FC<KpiBarProps> = ({ creances }) => {
  const active = creances.filter(c => !c.archived);

  let totalMnt = 0;
  let totalPaye = 0;
  let totalRetard = 0;
  let countRetard = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const c of active) {
    const m = Math.round(+c.montant || 0);
    const p = (c.paiements || []).reduce((acc, pay) => acc + (+pay.montant || 0), 0);
    const r = Math.max(0, m - p);
    totalMnt += m;
    totalPaye += p;
    if (c.echeance && r > 0 && c.echeance < today) {
      totalRetard += r;
      countRetard++;
    }
  }

  const restant = Math.max(0, totalMnt - totalPaye);
  const taux = totalMnt > 0 ? Math.round((totalPaye / totalMnt) * 100) : 0;

  // Ring calculation
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * taux) / 100;

  return (
    <section className="kpis" aria-label="Synthèse">
      {/* Total Créances */}
      <div className="kpi">
        <div className="lab">
          <span className="dot" style={{ background: 'var(--accent)' }} />
          Total Créances
        </div>
        <div className="val">
          {fmt(totalMnt)} <small>FCFA</small>
        </div>
        <div className="note">{active.length} lignes enregistrées</div>
      </div>

      {/* Encaissé */}
      <div className="kpi">
        <div className="lab">
          <span className="dot" style={{ background: 'var(--ok)' }} />
          Encaissé
        </div>
        <div className="val" style={{ color: 'var(--ok)' }}>
          {fmt(totalPaye)} <small>FCFA</small>
        </div>
        <div className="note">{active.filter(c => (c.paiements || []).length > 0).length} règlements partiels/soldés</div>
      </div>

      {/* Reste à recouvrer */}
      <div className="kpi">
        <div className="lab">
          <span className="dot" style={{ background: restant > 0 ? 'var(--bad)' : 'var(--ok)' }} />
          Reste à recouvrer
        </div>
        <div className="val" style={{ color: restant > 0 ? 'var(--bad)' : 'var(--ok)' }}>
          {fmt(restant)} <small>FCFA</small>
        </div>
        <div className="note">
          {countRetard > 0 ? `${countRetard} en retard (${fmt(totalRetard)} F)` : 'Aucun retard critique'}
        </div>
      </div>

      {/* Taux de recouvrement */}
      <div className="kpi">
        <div className="lab">
          <span className="dot" style={{ background: 'var(--info)' }} />
          Taux de recouvrement
        </div>
        <div className="kpi-ring">
          <svg className="ring" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r={radius} stroke="var(--surface-3)" />
            <circle
              cx="22"
              cy="22"
              r={radius}
              stroke="var(--ok)"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 22 22)"
            />
          </svg>
          <div>
            <div className="val" style={{ fontSize: '22px' }}>
              {taux}%
            </div>
            <div className="note" style={{ margin: 0 }}>recouvré</div>
          </div>
        </div>
      </div>
    </section>
  );
};
