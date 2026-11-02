import { Creance, Jour, Compte, ApiConfig, Paiement } from '../types';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const LS_CREANCES = 'papirotech.creances.v1';
const LS_JOURS = 'papirotech.jours.v1';
const LS_COMPTES = 'papirotech.comptes.v1';
const LS_API_CONFIG = 'papirotech.api_config.v1';

export const DEFAULT_COMPTES: Compte[] = [
  { k: 'esp', n: 'Espèces' },
  { k: 'cre', n: 'Créances' },
  { k: 'om', n: 'Orange Money' },
  { k: 'mob', n: 'Mobicash' },
  { k: 'wav', n: 'Wave' },
  { k: 'cred', n: 'Crédit' }
];

export const DEFAULT_API_CONFIG: ApiConfig = {
  supabaseUrl: (import.meta as any).env?.VITE_SUPABASE_URL || '',
  supabaseAnonKey: (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '',
  projectName: 'papirotech-niamana',
  vercelProjectId: 'prj_XVghIZG8DmZsHb7HGGZUtpCeTd2m'
};

export const uid = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};

export const storageService = {
  getApiConfig(): ApiConfig {
    try {
      const stored = localStorage.getItem(LS_API_CONFIG);
      if (stored) return { ...DEFAULT_API_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_API_CONFIG;
  },

  saveApiConfig(config: ApiConfig): void {
    localStorage.setItem(LS_API_CONFIG, JSON.stringify(config));
  },

  getSupabaseClient(): SupabaseClient | null {
    const config = this.getApiConfig();
    if (config.supabaseUrl && config.supabaseAnonKey && config.supabaseUrl.startsWith('https://')) {
      try {
        return createClient(config.supabaseUrl, config.supabaseAnonKey);
      } catch (e) {
        console.warn('Could not initialize Supabase client:', e);
      }
    }
    return null;
  },

  loadCreances(): Creance[] {
    try {
      const r = localStorage.getItem(LS_CREANCES);
      if (r) {
        const items = JSON.parse(r);
        if (Array.isArray(items)) {
          return items.filter(it => !/^s\d{2}$/.test(it.id));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  saveCreances(items: Creance[]): void {
    localStorage.setItem(LS_CREANCES, JSON.stringify(items));
  },

  loadJours(): Map<string, Jour> {
    const map = new Map<string, Jour>();
    try {
      const r = localStorage.getItem(LS_JOURS);
      if (r) {
        const a = JSON.parse(r);
        if (Array.isArray(a)) {
          a.forEach((j: Jour) => {
            if (j && j.date) map.set(j.date, j);
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
    return map;
  },

  saveJours(map: Map<string, Jour>): void {
    localStorage.setItem(LS_JOURS, JSON.stringify([...map.values()]));
  },

  loadComptes(): Compte[] {
    try {
      const r = localStorage.getItem(LS_COMPTES);
      if (r) {
        const a = JSON.parse(r);
        if (Array.isArray(a) && a.length > 0) return a;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_COMPTES;
  },

  saveComptes(comptes: Compte[]): void {
    localStorage.setItem(LS_COMPTES, JSON.stringify(comptes));
  }
};
