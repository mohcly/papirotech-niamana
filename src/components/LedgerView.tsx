import React, { useState, useMemo } from 'react';
import { Search, PlusCircle, UploadCloud } from 'lucide-react';
import { Creance } from '../types';
import { todayISO } from '../services/storageService';

interface LedgerViewProps {
  creances: Creance[];
  onSelect: (c: Creance) => void;
  onQuickPay: (c: Creance, e: React.MouseEvent) => void;
}

const fmt = (n: number) => Math.round(n || 0).toLocaleString('fr-FR');

export const LedgerView: React.FC<LedgerViewProps> = ({ creances, onSelect, onQuickPay }) => {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'tous' | 'retard' | 'impaye' | 'partiel' | 'solde' | 'archive'>('tous');
  const [sort, setSort] = useState<'rest-desc' | 'rest-asc' | 'due' | 'nom' | 'recent'>('rest-desc');

  const today = todayISO();

  // Compute counts
  const counts = useMemo(() => {
    const c = { tous: 0, retard: 0, impaye: 0, partiel: 0, solde: 0, archive: 0 };
    for (const item of creances) {
      if (item.archived) {
        c.archive++;
        continue;
      }
      c.tous++;
      const m = Math.round(+item.montant || 0);
      const p = (item.paiements || []).reduce((acc, x) => acc + (+x.montant || 0), 0);
      const r = Math.max(0, m - p);
      if (item.echeance && r > 0 && item.echeance < today) c.retard++;
      if (r <= 0) c.solde++;
      else if (p > 0) c.partiel++;
      else c.impaye++;
    }
    return c;
  }, [creances, today]);

  // Filter and sort items
  const filtered = useMemo(() => {
    return creances
      .filter(item => {
        if (filter === 'archive') return item.archived;
        if (item.archived) return false;

        const m = Math.round(+item.montant || 0);
        const p = (item.paiements || []).reduce((acc, x) => acc + (+x.montant || 0), 0);
        const r = Math.max(0, m - p);

        if (filter === 'retard') return !!(item.echeance && r > 0 && item.echeance < today);
        if (filter === 'impaye') return p === 0 && r > 0;
        if (filter === 'partiel') return p > 0 && r > 0;
        if (filter === 'solde') return r <= 0;
        return true;
      })
      .filter(item => {
        if (!q.trim()) return true;
        const term = q.toLowerCase();
        return (
          item.nom.toLowerCase().includes(term) ||
          (item.tel && item.tel.includes(term)) ||
          (item.note && item.note.toLowerCase().includes(term)) ||
          (item.cat && item.cat.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        const ma = Math.round(+a.montant || 0);
        const pa = (a.paiements || []).reduce((acc, x) => acc + (+x.montant || 0), 0);
        const ra = Math.max(0, ma - pa);

        const mb = Math.round(+b.montant || 0);
        const pb = (b.paiements || []).reduce((acc, x) => acc + (+x.montant || 0), 0);
        const rb = Math.max(0, mb - pb);

        if (sort === 'rest-desc') return rb - ra;
        if (sort === 'rest-asc') return ra - rb;
        if (sort === 'nom') return a.nom.localeCompare(b.nom, 'fr');
        if (sort === 'due') {
          if (!a.echeance) return 1;
          if (!b.echeance) return -1;
          return a.echeance.localeCompare(b.echeance);
        }
        if (sort === 'recent') {
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        }
        return 0;
      });
  }, [creances, q, filter, sort, today]);

  const triggerPickFile = () => {
    window.dispatchEvent(new Event('papirotech:pick-file'));
  };

  return (
    <div id="viewRegistre">
      <div className="toolbar">
        {/* Search Input */}
        <div className="search">
          <Search size={15} />
          <input
            type="search"
            placeholder="Rechercher un client, téléphone, note… ( / )"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>

        {/* Chips */}
        <div className="chips">
          {[
            { id: 'tous', label: 'Tous', count: counts.tous },
            { id: 'retard', label: 'En retard', count: counts.retard },
            { id: 'impaye', label: 'Impayés', count: counts.impaye },
            { id: 'partiel', label: 'Partiels', count: counts.partiel },
            { id: 'solde', label: 'Soldés', count: counts.solde },
            { id: 'archive', label: 'Archivés', count: counts.archive }
          ].map(ch => (
            <button
              key={ch.id}
              className="chip"
              aria-pressed={filter === ch.id}
              onClick={() => setFilter(ch.id as any)}
            >
              {ch.label}
              <span className="n">{ch.count}</span>
            </button>
          ))}
        </div>

        {/* Sorting */}
        <select className="sel" value={sort} onChange={e => setSort(e.target.value as any)}>
          <option value="rest-desc">Reste — du plus grand</option>
          <option value="rest-asc">Reste — du plus petit</option>
          <option value="due">Échéance la plus proche</option>
          <option value="nom">Nom (A → Z)</option>
          <option value="recent">Ajouté récemment</option>
        </select>
      </div>

      {/* Ledger Table */}
      <div className="ledger">
        <div className="lrow lhead">
          <div className="stripe" />
          <span>Nom du tiers</span>
          <span style={{ textAlign: 'right' }}>Total dû</span>
          <span style={{ textAlign: 'right' }}>Encaissé</span>
          <span style={{ textAlign: 'right' }}>Reste à payer</span>
          <span>Échéance</span>
          <span>Statut</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <div className="empty">
            <h3>{creances.length === 0 ? 'Registre vierge' : 'Aucune créance correspondante'}</h3>
            <p>
              {creances.length === 0
                ? 'Aucune donnée enregistrée pour le moment. Touchez "Importer" ci-dessous ou glissez-déposez vos fichiers (Excel, CSV, JSON) pour commencer.'
                : 'Modifiez vos critères de recherche ou de filtre pour afficher les lignes du registre.'}
            </p>
            {creances.length === 0 && (
              <button
                type="button"
                className="btn"
                onClick={triggerPickFile}
                style={{ marginTop: '8px' }}
              >
                <UploadCloud size={16} />
                <span>Importer un fichier Excel ou CSV</span>
              </button>
            )}
          </div>
        ) : (
          filtered.map(item => {
            const m = Math.round(+item.montant || 0);
            const p = (item.paiements || []).reduce((acc, x) => acc + (+x.montant || 0), 0);
            const r = Math.max(0, m - p);
            const isLate = !!(item.echeance && r > 0 && item.echeance < today);
            const isSolde = r <= 0;
            const isPartiel = p > 0 && r > 0;

            const stripeColor = isSolde
              ? 'var(--ok)'
              : isLate
              ? 'var(--bad)'
              : isPartiel
              ? 'var(--info)'
              : 'var(--line-strong)';

            const lastJournal = (item.journal || []).slice(-1)[0];

            return (
              <div
                key={item.id}
                className="lrow item"
                role="button"
                tabIndex={0}
                onClick={() => onSelect(item)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(item);
                  }
                }}
              >
                <div className="stripe" style={{ background: stripeColor }} />

                <div className="c-name">
                  <b>{item.nom}</b>
                  <div className="meta">
                    {item.tel && <span>{item.tel} • </span>}
                    <span>{item.sens === 'fournisseur' ? 'Dette Fournisseur' : 'Créance Client'}</span>
                    {item.cat && <span> • {item.cat}</span>}
                  </div>
                  {lastJournal && <div className="hist">{lastJournal.txt}</div>}
                </div>

                <div className="c-num c-total muted">{fmt(m)} F</div>
                <div className="c-num c-paye muted" style={{ color: p > 0 ? 'var(--ok)' : undefined }}>
                  {fmt(p)} F
                </div>
                <div className="c-num strong c-rest" style={{ color: isSolde ? 'var(--ok)' : 'var(--fg)' }}>
                  {fmt(r)} F
                </div>

                <div className="c-due">
                  {item.echeance ? (
                    <span className={isLate ? 'late' : ''}>
                      {item.echeance.split('-').reverse().join('/')}
                      {isLate && ' ⚠️'}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--fg-3)' }}>—</span>
                  )}
                </div>

                <div className="c-pill">
                  {isSolde ? (
                    <span className="pill solde">Soldé</span>
                  ) : isLate ? (
                    <span className="pill retard">Retard</span>
                  ) : isPartiel ? (
                    <span className="pill partiel">Partiel</span>
                  ) : (
                    <span className="pill impaye">Impayé</span>
                  )}
                </div>

                {/* Quick Payment Button with 44x44 touch target */}
                <button
                  type="button"
                  className="quick"
                  title="Encaisser un règlement"
                  onClick={e => onQuickPay(item, e)}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <PlusCircle size={17} />
                </button>

                {/* Mobile Extra info */}
                <div className="row-mobile">
                  <span>Total : <b className="num">{fmt(m)} F</b></span>
                  <span>• Reste : <b className="num" style={{ color: isSolde ? 'var(--ok)' : 'var(--bad)' }}>{fmt(r)} F</b></span>
                  {item.echeance && <span>• Éch : {item.echeance.split('-').reverse().join('/')}</span>}
                </div>
              </div>
            );
          })
        )}

        {filtered.length > 0 && (
          <div className="foot">
            <div><b>{filtered.length}</b> lignes affichées</div>
            <div>
              Total restant : <b>
                {fmt(
                  filtered.reduce((acc, item) => {
                    const m = Math.round(+item.montant || 0);
                    const p = (item.paiements || []).reduce((s, x) => s + (+x.montant || 0), 0);
                    return acc + Math.max(0, m - p);
                  }, 0)
                )} FCFA
              </b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
