import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { KpiBar } from './components/KpiBar';
import { LedgerView } from './components/LedgerView';
import { FondsView } from './components/FondsView';
import { StatsView } from './components/StatsView';
import { DrawerDetail } from './components/DrawerDetail';
import { AuthModal } from './components/AuthModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { ApiKeysModal } from './components/ApiKeysModal';
import { DragDropOverlay } from './components/DragDropOverlay';
import { NewCreanceModal } from './components/NewCreanceModal';
import { ManageComptesModal } from './components/ManageComptesModal';
import { authService } from './services/authService';
import { storageService, todayISO } from './services/storageService';
import { importerService } from './services/importerService';
import { Creance, Jour, Compte, UserSession, ImportPreview } from './types';

export const App: React.FC = () => {
  // Authentication state
  const [user, setUser] = useState<UserSession | null>(() => authService.getCurrentUser());

  // Data state
  const [creances, setCreances] = useState<Creance[]>(() => storageService.loadCreances());
  const [jours, setJours] = useState<Map<string, Jour>>(() => storageService.loadJours());
  const [comptes, setComptes] = useState<Compte[]>(() => storageService.loadComptes());

  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<'registre' | 'fond' | 'stats'>('registre');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('papirotech.theme') as any) || 'light';
  });

  // Modals & Drawers
  const [selectedCreance, setSelectedCreance] = useState<Creance | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showComptesModal, setShowComptesModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const toastTimerRef = useRef<number | null>(null);

  // Apply theme to document and update theme-color meta tag
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('papirotech.theme', theme);

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', theme === 'dark' ? '#0f141a' : '#eceef0');
  }, [theme]);

  // Persist Creances
  useEffect(() => {
    storageService.saveCreances(creances);
  }, [creances]);

  // Persist Jours
  useEffect(() => {
    storageService.saveJours(jours);
  }, [jours]);

  // Persist Comptes
  useEffect(() => {
    storageService.saveComptes(comptes);
  }, [comptes]);

  // Toast Helper with proper timer cleanup
  const showToast = (msg: string) => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMsg(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
      toastTimerRef.current = null;
    }, 3800);
  };

  // Drag & drop bulk import handler
  const handleImportComplete = (preview: ImportPreview, mode: 'merge' | 'replace') => {
    const newItems = importerService.toCreances(preview.validItems);

    if (mode === 'replace') {
      setCreances(newItems);
      showToast(`${newItems.length} créances importées (registre réinitialisé).`);
    } else {
      setCreances(prev => [...newItems, ...prev]);
      showToast(`${newItems.length} créances fusionnées avec succès.`);
    }
  };

  // Quick Payment Handler from Ledger Row
  const handleQuickPay = (c: Creance, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCreance(c);
  };

  // Export JSON backup with local date
  const handleExportBackup = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      creances,
      jours: [...jours.values()],
      comptes
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `papirotech_niamana_backup_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Sauvegarde exportée avec succès.');
  };

  if (!user) {
    return <AuthModal onSuccess={u => setUser(u)} />;
  }

  return (
    <div className="wrap">
      {/* Global Drag & Drop Overlay */}
      <DragDropOverlay
        onImportComplete={handleImportComplete}
        onError={err => showToast(`⚠️ ${err}`)}
      />

      {/* Main App Header */}
      <Header
        user={user}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenNew={() => setShowNewModal(true)}
        onOpenKeys={() => setShowKeysModal(true)}
        onOpenPassword={() => setShowPasswordModal(true)}
        onLogout={() => {
          authService.logout();
          setUser(null);
        }}
        onExport={handleExportBackup}
      />

      {/* Top KPI Bar */}
      <KpiBar creances={creances} />

      {/* Main Navigation Tabs */}
      <div className="tabs" role="tablist">
        <button
          className="tab"
          role="tab"
          aria-selected={activeTab === 'registre'}
          onClick={() => setActiveTab('registre')}
        >
          Créances & Règlements
        </button>
        <button
          className="tab"
          role="tab"
          aria-selected={activeTab === 'fond'}
          onClick={() => setActiveTab('fond')}
        >
          Suivi du fonds de roulement
        </button>
        <button
          className="tab"
          role="tab"
          aria-selected={activeTab === 'stats'}
          onClick={() => setActiveTab('stats')}
        >
          Statistiques & Aging
        </button>
      </div>

      {/* Tab 1: Créances Ledger */}
      {activeTab === 'registre' && (
        <LedgerView
          creances={creances}
          onSelect={c => setSelectedCreance(c)}
          onQuickPay={handleQuickPay}
        />
      )}

      {/* Tab 2: Suivi du Fonds */}
      {activeTab === 'fond' && (
        <FondsView
          jours={jours}
          comptes={comptes}
          onUpdateJour={(date, soldes) => {
            setJours(prev => {
              const copy = new Map(prev);
              copy.set(date, { date, soldes });
              return copy;
            });
          }}
          onManageComptes={() => setShowComptesModal(true)}
        />
      )}

      {/* Tab 3: Statistiques */}
      {activeTab === 'stats' && <StatsView creances={creances} />}

      {/* Drawer: Detail of selected debt */}
      {selectedCreance && (
        <DrawerDetail
          creance={selectedCreance}
          onClose={() => setSelectedCreance(null)}
          onUpdate={updated => {
            setCreances(prev => prev.map(item => (item.id === updated.id ? updated : item)));
            setSelectedCreance(updated);
          }}
          onDelete={id => {
            setCreances(prev => prev.filter(item => item.id !== id));
            setSelectedCreance(null);
          }}
          onToast={showToast}
        />
      )}

      {/* Modal: New Debt */}
      {showNewModal && (
        <NewCreanceModal
          onClose={() => setShowNewModal(false)}
          onSave={newItem => {
            setCreances(prev => [newItem, ...prev]);
            showToast(`Ligne pour ${newItem.nom} ajoutée au registre.`);
          }}
        />
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={msg => showToast(msg)}
        />
      )}

      {/* Modal: API Keys & Supabase */}
      {showKeysModal && (
        <ApiKeysModal
          onClose={() => setShowKeysModal(false)}
          onSuccess={msg => showToast(msg)}
        />
      )}

      {/* Modal: Manage Treasury Accounts */}
      {showComptesModal && (
        <ManageComptesModal
          comptes={comptes}
          onClose={() => setShowComptesModal(false)}
          onSave={updated => {
            setComptes(updated);
            showToast('Comptes de trésorerie mis à jour.');
          }}
        />
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="toast">
          <span>{toastMsg}</span>
          <button type="button" onClick={() => setToastMsg(null)}>Fermer</button>
        </div>
      )}
    </div>
  );
};
