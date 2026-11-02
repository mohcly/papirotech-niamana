import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { ImportPreview } from '../types';
import { importerService } from '../services/importerService';
import { useSheet } from '../hooks/useSheet';

interface DragDropOverlayProps {
  onImportComplete: (preview: ImportPreview, mode: 'merge' | 'replace') => void;
  onError: (msg: string) => void;
}

export const DragDropOverlay: React.FC<DragDropOverlayProps> = ({ onImportComplete, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useSheet(() => {
    if (preview) setPreview(null);
  });

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const result = await importerService.parseFile(file);
      if (result.validItems.length === 0) {
        onErrorRef.current('Aucune ligne valide (nom et montant) détectée.');
      } else {
        setPreview(result);
        setConfirmReplace(false);
      }
    } catch (err: any) {
      onErrorRef.current(err.message || "Erreur lors de l'analyse du fichier.");
    } finally {
      setParsing(false);
    }
  };

  useEffect(() => {
    let dragCounter = 0;
    const enter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer?.types.includes('Files')) setIsDragging(true);
    };
    const leave = (e: DragEvent) => {
      e.preventDefault();
      if (--dragCounter <= 0) {
        dragCounter = 0;
        setIsDragging(false);
      }
    };
    const over = (e: DragEvent) => e.preventDefault();
    const drop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter = 0;
      setIsDragging(false);
      const f = e.dataTransfer?.files?.[0];
      if (f) handleFile(f);
    };
    const pick = () => inputRef.current?.click();

    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    window.addEventListener('papirotech:pick-file', pick);

    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
      window.removeEventListener('papirotech:pick-file', pick);
    };
  }, []);

  return (
    <>
      {/* Hidden file input for mobile and manual upload */}
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".xlsx,.xls,.csv,.json,.txt,text/csv,application/json,text/plain"
        onChange={e => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (f) handleFile(f);
        }}
      />

      {/* Visual drag backdrop when user hovers file over desktop browser */}
      {isDragging && (
        <div className="dropzone-overlay">
          <div className="dropzone-icon">
            <UploadCloud size={40} />
          </div>
          <h2>Déposez votre fichier ici</h2>
          <p>
            Glissez vos fichiers <b>Excel (.xlsx, .xls)</b>, <b>CSV</b>, <b>JSON</b> ou <b>Texte</b>.
            Papirotech détectera automatiquement les noms de clients, montants et numéros de téléphone.
          </p>
        </div>
      )}

      {/* Parsing spinner */}
      {parsing && (
        <div className="modal">
          <div className="sheet" style={{ maxWidth: '340px', textAlign: 'center', padding: '32px' }}>
            <div className="dropzone-icon" style={{ margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}>
              <FileSpreadsheet size={32} />
            </div>
            <h3>Analyse intelligente…</h3>
            <div className="sub" style={{ margin: '8px 0 0' }}>Extraction des colonnes et montants</div>
          </div>
        </div>
      )}

      {/* Confirmation Modal once file is parsed */}
      {preview && (
        <div
          className="modal"
          onPointerDown={e => {
            if (e.target === e.currentTarget) setPreview(null);
          }}
        >
          <div className="sheet" style={{ maxWidth: '560px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <div className="eyebrow" style={{ color: 'var(--ok)' }}>Détection automatique réussie</div>
                <h2>Aperçu de l'importation</h2>
              </div>
              <button className="icon-btn" onClick={() => setPreview(null)} aria-label="Fermer">
                <X size={16} />
              </button>
            </div>

            <div className="sub">
              Fichier : <b>{preview.fileName}</b> ({preview.fileType}) — <b>{preview.validItems.length} créances</b> identifiées.
            </div>

            <div style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '12px',
              maxHeight: '220px',
              overflowY: 'auto',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '11.5px', color: 'var(--fg-3)', marginBottom: '8px', fontWeight: 600 }}>
                EXTRAIT DES PREMIÈRES LIGNES DÉTECTÉES :
              </div>
              {preview.validItems.slice(0, 6).map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderTop: idx > 0 ? '1px solid var(--line)' : 'none',
                  fontSize: '12.5px'
                }}>
                  <div>
                    <b>{item.nom}</b>
                    {item.tel && <span style={{ color: 'var(--fg-3)', marginLeft: '8px' }}>({item.tel})</span>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-num)', fontWeight: 600, color: 'var(--accent)' }}>
                    {item.montant.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              ))}
              {preview.validItems.length > 6 && (
                <div style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--fg-3)', marginTop: '8px' }}>
                  … et {preview.validItems.length - 6} autres lignes
                </div>
              )}
            </div>

            <div style={{ fontSize: '12px', color: 'var(--fg-2)', marginBottom: '16px' }}>
              Comment souhaitez-vous charger ces données ?
            </div>

            <div className="actions" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className={`btn ${confirmReplace ? 'danger' : 'ghost'}`}
                style={confirmReplace ? { background: 'var(--bad)', color: '#fff', borderColor: 'var(--bad)' } : { color: 'var(--bad)' }}
                onClick={() => {
                  if (confirmReplace) {
                    onImportComplete(preview, 'replace');
                    setPreview(null);
                    setConfirmReplace(false);
                  } else {
                    setConfirmReplace(true);
                  }
                }}
              >
                {confirmReplace ? '⚠️ Confirmer : tout effacer' : 'Remplacer tout le registre'}
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn ghost" onClick={() => setPreview(null)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    onImportComplete(preview, 'merge');
                    setPreview(null);
                    setConfirmReplace(false);
                  }}
                >
                  <CheckCircle2 size={15} />
                  Fusionner ({preview.validItems.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
