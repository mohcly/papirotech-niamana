import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Jour, Compte } from '../types';
import { todayISO } from '../services/storageService';

interface FondsViewProps {
  jours: Map<string, Jour>;
  comptes: Compte[];
  onUpdateJour: (date: string, soldes: Record<string, number>) => void;
  onManageComptes: () => void;
}

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const fmt = (n: number) => Math.round(n || 0).toLocaleString('fr-FR');
const pad2 = (n: number) => String(n).padStart(2, '0');
const dim = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const iso = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

export const FondsView: React.FC<FondsViewProps> = ({
  jours,
  comptes,
  onUpdateJour,
  onManageComptes
}) => {
  const [y, setY] = useState(new Date().getFullYear());
  const [m, setM] = useState(new Date().getMonth());

  const daysInMonth = dim(y, m);
  const today = todayISO();

  const touch = useRef<{ x: number; y: number } | null>(null);
  const chipsRef = useRef<HTMLDivElement>(null);

  const shiftMonth = (delta: number) => {
    const d = new Date(y, m + delta, 1);
    setY(d.getFullYear());
    setM(d.getMonth());
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      (navigator as any).vibrate?.(8);
    }
  };

  useEffect(() => {
    chipsRef.current
      ?.querySelector('[aria-pressed="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [m, y]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || !window.matchMedia('(max-width: 699px)').matches) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 40) {
      shiftMonth(dx < 0 ? 1 : -1);
    }
  };

  const handleCellChange = (date: string, compteKey: string, cleanDigits: string) => {
    const val = cleanDigits ? Math.round(+cleanDigits) || 0 : 0;
    const existing = jours.get(date)?.soldes || {};
    const updatedSoldes = { ...existing, [compteKey]: val };
    onUpdateJour(date, updatedSoldes);
  };

  // Compute month summary
  const monthRows = useMemo(() => {
    const rows = [];
    let prevTotal: number | null = null;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = iso(y, m, d);
      const isToday = dateStr === today;
      const isFuture = dateStr > today;
      const soldes = jours.get(dateStr)?.soldes || {};

      let dayTotal = 0;
      let hasAny = false;
      for (const c of comptes) {
        if (soldes[c.k] != null) {
          dayTotal += soldes[c.k];
          hasAny = true;
        }
      }

      let diff = 0;
      let pct = 0;
      if (prevTotal !== null && hasAny) {
        diff = dayTotal - prevTotal;
        pct = prevTotal > 0 ? (diff / prevTotal) * 100 : 0;
      }

      if (hasAny) {
        prevTotal = dayTotal;
      }

      rows.push({
        d,
        dateStr,
        isToday,
        isFuture,
        hasAny,
        soldes,
        dayTotal,
        diff,
        pct
      });
    }

    return rows;
  }, [y, m, daysInMonth, jours, comptes, today]);

  // Account comparison totals (latest known day)
  const latestSoldes = useMemo(() => {
    for (let i = monthRows.length - 1; i >= 0; i--) {
      if (monthRows[i].hasAny) return monthRows[i].soldes;
    }
    return {};
  }, [monthRows]);

  return (
    <div id="viewFond">
      {/* Month & Year Bar */}
      <div className="monthbar">
        {/* Year Selector */}
        <div className="yearnav">
          <button type="button" onClick={() => setY(y - 1)} title="Année précédente">
            <ChevronLeft size={16} />
          </button>
          <b>{y}</b>
          <button type="button" onClick={() => setY(y + 1)} title="Année suivante">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Month Chips with touch auto-scroll */}
        <div className="mchips" ref={chipsRef}>
          {MOIS.map((nom, idx) => (
            <button
              key={idx}
              className="mchip"
              aria-pressed={m === idx}
              onClick={() => setM(idx)}
            >
              {nom}
            </button>
          ))}
        </div>

        {/* Configure Accounts */}
        <button
          type="button"
          className="btn ghost"
          onClick={onManageComptes}
          style={{ marginLeft: 'auto' }}
        >
          <Settings size={15} />
          Gérer les comptes ({comptes.length})
        </button>
      </div>

      {/* Account Balance Summary Cards */}
      <div className="cmp-grid">
        {comptes.map(c => {
          const val = latestSoldes[c.k] || 0;
          return (
            <div key={c.k} className="cmp">
              <div className="n">{c.n}</div>
              <div className="v">{fmt(val)} F</div>
              <div className="dlt" style={{ color: 'var(--fg-3)' }}>Solde récent</div>
            </div>
          );
        })}
      </div>

      {/* Daily Ledger Table with mobile swipe & collapsible cards */}
      <div
        className="gridwrap"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <table className="ftable">
          <thead>
            <tr>
              <th style={{ width: '110px' }}>Date</th>
              {comptes.map(c => (
                <th key={c.k}>{c.n}</th>
              ))}
              <th style={{ width: '120px' }}>Total Jour</th>
              <th style={{ width: '100px' }}>Variation</th>
            </tr>
          </thead>
          <tbody>
            {monthRows.map(row => (
              <tr
                key={row.d}
                className={`${row.isToday ? 'today' : ''} ${row.isFuture ? 'futur' : ''}`}
              >
                <td className="d">
                  {pad2(row.d)}/{pad2(m + 1)} {row.isToday ? '★ Aujourd\'hui' : ''}
                </td>

                {comptes.map(c => (
                  <td key={c.k} data-label={c.n}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      enterKeyHint="next"
                      className="cellin"
                      placeholder="—"
                      value={row.soldes[c.k] ?? ''}
                      onChange={e =>
                        handleCellChange(row.dateStr, c.k, e.target.value.replace(/[^\d]/g, ''))
                      }
                    />
                  </td>
                ))}

                <td className="t-total" data-label="Total jour">
                  {row.hasAny ? `${fmt(row.dayTotal)} F` : '—'}
                </td>

                <td className="t-var" data-label="Variation">
                  {row.hasAny && row.diff !== 0 ? (
                    <span className={row.diff > 0 ? 'up' : 'down'}>
                      {row.diff > 0 ? `+${fmt(row.diff)}` : fmt(row.diff)} F
                    </span>
                  ) : (
                    <span className="flat">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
