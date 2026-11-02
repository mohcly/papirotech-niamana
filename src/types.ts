export interface Paiement {
  id: string;
  date: string;
  montant: number;
  mode: string;
}

export interface JournalEntry {
  t: string;
  txt: string;
}

export interface Creance {
  id: string;
  nom: string;
  tel?: string;
  sens?: 'client' | 'fournisseur';
  cat?: string;
  note?: string;
  echeance?: string;
  date?: string;
  createdAt?: string;
  montant: number;
  archived: boolean;
  paiements: Paiement[];
  journal: JournalEntry[];
}

export interface Jour {
  date: string;
  soldes: Record<string, number>;
}

export interface Compte {
  k: string;
  n: string;
}

export interface UserSession {
  email: string;
  token: string;
  name?: string;
}

export interface ApiConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  projectName: string;
  vercelProjectId: string;
}

export interface ParsedRecord {
  id?: string;
  nom: string;
  montant: number;
  tel?: string;
  sens?: 'client' | 'fournisseur';
  cat?: string;
  date?: string;
  echeance?: string;
  note?: string;
}

export interface ImportPreview {
  fileName: string;
  fileType: string;
  totalFound: number;
  validItems: ParsedRecord[];
  detectedColumns: string[];
}
