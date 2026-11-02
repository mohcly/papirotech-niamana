import * as XLSX from 'xlsx';
import { Creance, ParsedRecord, ImportPreview } from '../types';
import { uid, todayISO } from './storageService';

function cleanAmount(raw: any): number {
  if (typeof raw === 'number') return Math.round(raw);
  if (!raw) return 0;
  const str = String(raw).replace(/[\s\u00A0\u202F\u2009FCFAfcfa$€]/g, '').replace(',', '.');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function findKey(keys: string[], patterns: RegExp[]): string | undefined {
  for (const pat of patterns) {
    const match = keys.find(k => pat.test(k.trim()));
    if (match) return match;
  }
  return undefined;
}

export const importerService = {
  async parseFile(file: File): Promise<ImportPreview> {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const buffer = await file.arrayBuffer();

    let records: ParsedRecord[] = [];
    let detectedColumns: string[] = [];

    if (ext === 'xlsx' || ext === 'xls' || ext === 'ods') {
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

      if (rawRows.length > 0) {
        detectedColumns = Object.keys(rawRows[0]);
        records = this.normalizeRows(rawRows);
      }
    } else if (ext === 'csv' || ext === 'tsv' || ext === 'txt') {
      const text = new TextDecoder('utf-8').decode(buffer);
      records = this.parseCsvOrText(text);
      if (records.length > 0) {
        detectedColumns = ['Nom', 'Montant', 'Téléphone', 'Échéance', 'Note'];
      }
    } else if (ext === 'json') {
      const text = new TextDecoder('utf-8').decode(buffer);
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          records = this.normalizeRows(parsed);
          detectedColumns = Object.keys(parsed[0] || {});
        } else if (parsed && Array.isArray(parsed.creances)) {
          records = this.normalizeRows(parsed.creances);
          detectedColumns = ['id', 'nom', 'montant', 'paiements'];
        } else if (parsed && typeof parsed === 'object') {
          // Flatten key-value pairs (e.g. { "Djelimory": 186500 })
          records = Object.entries(parsed).map(([k, v]) => ({
            id: uid(),
            nom: k,
            montant: cleanAmount(v),
            sens: 'client',
            date: todayISO()
          }));
          detectedColumns = ['Clé', 'Valeur'];
        }
      } catch (err) {
        throw new Error('Format JSON invalide.');
      }
    } else {
      // Fallback try CSV parser
      const text = new TextDecoder('utf-8').decode(buffer);
      records = this.parseCsvOrText(text);
    }

    const validItems = records.filter(r => r.nom && r.nom.trim().length > 0 && r.montant > 0);

    return {
      fileName: file.name,
      fileType: ext.toUpperCase() || 'DOCUMENT',
      totalFound: records.length,
      validItems,
      detectedColumns
    };
  },

  normalizeRows(rows: any[]): ParsedRecord[] {
    if (!rows || rows.length === 0) return [];
    const keys = Object.keys(rows[0]);

    const nomKey = findKey(keys, [/nom/i, /client/i, /destinataire/i, /tiers/i, /name/i, /fournisseur/i]);
    const mntKey = findKey(keys, [/montant/i, /solde/i, /total/i, /somme/i, /reste/i, /amount/i, /valeur/i, /debit/i]);
    const telKey = findKey(keys, [/tel/i, /téléphone/i, /telephone/i, /phone/i, /contact/i, /mobile/i]);
    const dateKey = findKey(keys, [/date/i, /creation/i, /cree/i]);
    const echKey = findKey(keys, [/echeance/i, /échéance/i, /due/i, /limite/i]);
    const noteKey = findKey(keys, [/note/i, /observation/i, /commentaire/i, /motif/i, /libelle/i, /description/i]);

    return rows.map((r, i) => {
      const nom = nomKey ? String(r[nomKey] || '').trim() : (r[keys[0]] ? String(r[keys[0]]) : `Client #${i + 1}`);
      const montant = mntKey ? cleanAmount(r[mntKey]) : cleanAmount(r[keys[1]]);
      const tel = telKey ? String(r[telKey] || '').trim() : undefined;
      const date = dateKey && r[dateKey] ? String(r[dateKey]).slice(0, 10) : todayISO();
      const echeance = echKey && r[echKey] ? String(r[echKey]).slice(0, 10) : undefined;
      const note = noteKey && r[noteKey] ? String(r[noteKey]) : undefined;

      return {
        id: uid(),
        nom: nom || `Ligne importée #${i + 1}`,
        montant: montant || 0,
        tel,
        date,
        echeance,
        note,
        sens: 'client'
      };
    });
  },

  parseCsvOrText(text: string): ParsedRecord[] {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // Detect delimiter
    const firstLine = lines[0];
    const delim = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');
    const hasHeader = /nom|client|montant|amount|solde/i.test(firstLine);

    const dataLines = hasHeader ? lines.slice(1) : lines;
    const records: ParsedRecord[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (line.includes(delim)) {
        const parts = line.split(delim).map(p => p.trim().replace(/^["']|["']$/g, ''));
        if (parts.length >= 2) {
          const nom = parts[0];
          const montant = cleanAmount(parts[1]);
          const tel = parts[2] || undefined;
          records.push({
            id: uid(),
            nom,
            montant,
            tel,
            sens: 'client',
            date: todayISO()
          });
          continue;
        }
      }

      // Plain text regex: e.g. "Djelimory: 186 500" or "Djelimory - 186500 FCFA"
      const match = line.match(/^([A-Za-zÀ-ÖØ-öø-ÿ\s\.\-_]+)[:=\-—]\s*([0-9\s.,]+)/);
      if (match) {
        records.push({
          id: uid(),
          nom: match[1].trim(),
          montant: cleanAmount(match[2]),
          sens: 'client',
          date: todayISO()
        });
      }
    }

    return records;
  },

  toCreances(parsed: ParsedRecord[]): Creance[] {
    const now = new Date().toISOString();
    return parsed.map((p, idx) => ({
      id: p.id || uid(),
      nom: p.nom,
      montant: p.montant,
      tel: p.tel,
      sens: p.sens || 'client',
      cat: p.cat || 'Général',
      note: p.note || 'Import automatique groupé',
      date: p.date || todayISO(),
      echeance: p.echeance,
      createdAt: now,
      archived: false,
      paiements: [],
      journal: [
        {
          t: now,
          txt: `Ligne importée par glisser-déposer — ${p.montant.toLocaleString('fr-FR')} FCFA`
        }
      ]
    }));
  }
};
