import React from 'react';
import { Creance } from '../types';

interface StatsViewProps {
  creances: Creance[];
}

const fmt = (n: number) => Math.round(n || 0).toLocaleString('fr-FR');
const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

export const StatsView: React.FC<StatsViewProps> = ({ creances }) => {
  const active = creances.filter(c => !c.archived);
  const today = todayISO();

  // Top Debtors
  const debtors = active
    .map(c => {
      const m = Math.round(+c.montant || 0);
      const p = (c.paiements || []).reduce((acc, pay) => acc + (+pay.montant || 0), 0);
      const r = Math.max(0, m - p);
      return { nom: c.nom, reste: r };
    })
    .filter(d => d.reste > 0)
    .sort((a, b) => b.reste - a.reste)
    .slice(0, 8);

  const maxReste = debtors.length > 0 ? debtors[0].reste : 1;

  // Aging Analysis
  const aging = { m30: 0, m60: 0, m90: 0, p90: 0 };
  let totalAging = 0;

  for (const c of active) {
    const m = Math.round(+c.montant || 0);
    const p = (c.paiements || []).reduce((acc, pay) => acc + (+pay.montant || 0), 0);
    const r = Math.max(0, m - p);
    if (r <= 0) continue;

    const baseDate = c.echeance || c.date || (c.createdAt ? c.createdAt.slice(0, 10) : today);
    const age = Math.max(0, daysBetween(baseDate, today));

    if (age <= 30) aging.m30 += r;
    else if (age <= 60) aging.m60 += r;
    else if (age <= 90) aging.m90 += r;
    else aging.p90 += r;

    totalAging += r;
  }

  return (
    <div className="stats">
      {/* Top 8 Débiteurs */}
      <div className="card">
        <h3>Plus grosses créances en cours</h3>
        <div className="hint">Les 8 clients concentrant le plus d'impayés</div>
        {debtors.length === 0 ? (
          <div style={{ color: 'var(--fg-3)', fontSize: '13px' }}>Aucune créance impayée.</div>
        ) : (
          <div className="bars">
            {debtors.map((d, i) => {
              const widthPct = Math.round((d.reste / maxReste) * 100);
              return (
                <div key={i} className="bar-row">
                  <div className="nm">{d.nom}</div>
                  <div className="vl">{fmt(d.reste)} F</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${widthPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aging de la dette */}
      <div className="card">
        <h3>Ancienneté de la dette (Aging)</h3>
        <div className="hint">Répartition du restant dû selon la date d'échéance</div>
        <div className="aging">
          {[
            { label: 'Moins de 30 j', val: aging.m30, color: 'var(--ok)' },
            { label: '31 à 60 jours', val: aging.m60, color: 'var(--info)' },
            { label: '61 à 90 jours', val: aging.m90, color: 'var(--accent)' },
            { label: 'Plus de 90 jours', val: aging.p90, color: 'var(--bad)' }
          ].map((row, idx) => {
            const pct = totalAging > 0 ? Math.round((row.val / totalAging) * 100) : 0;
            return (
              <div key={idx} className="age-row">
                <div className="k">{row.label}</div>
                <div className="t">
                  <div className="f" style={{ width: `${pct}%`, background: row.color }} />
                </div>
                <div className="v">{fmt(row.val)} F</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
