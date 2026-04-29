// Import Wizard - Main container component

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useUIStore } from '../../stores/uiStore';
import { SourceSelector } from './SourceSelector';
import { FileDropZone } from './FileDropZone';
import { ImportPreview } from './ImportPreview';
import { ImportProgress } from './ImportProgress';
import { ImportComplete } from './ImportComplete';
import type { ImportCandidate, ImportParseResult, ImportResult } from '@scync/core';

type Step = 'source' | 'upload' | 'preview' | 'importing' | 'complete';

export const ImportWizard: React.FC = () => {
  const { isImportWizardOpen, importSource, closeImportWizard } = useUIStore();
  const [step, setStep] = useState<Step>(importSource ? 'upload' : 'source'); // Start at upload if source already selected
  const [parseResult, setParseResult] = useState<ImportParseResult | null>(null);
  const [candidates, setCandidates] = useState<ImportCandidate[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const handleClose = () => {
    closeImportWizard();
    // Reset state after animation
    setTimeout(() => {
      setStep(importSource ? 'upload' : 'source'); // Skip source selection if already chosen
      setParseResult(null);
      setCandidates([]);
      setImportResult(null);
    }, 300);
  };

  const handleSourceSelect = (source: 'bitwarden' | 'onepassword') => {
    useUIStore.getState().openImportWizard(source);
    setStep('upload');
  };

  const handleFileParsed = (result: ImportParseResult) => {
    setParseResult(result);
    setCandidates(result.candidates);
    setStep('preview');
  };

  const handleStartImport = (selectedCandidates: ImportCandidate[]) => {
    setCandidates(selectedCandidates);
    setStep('importing');
  };

  const handleImportComplete = (result: ImportResult) => {
    setImportResult(result);
    setStep('complete');
  };

  const handleBack = () => {
    if (step === 'upload') {
      if (importSource) {
        // If source was pre-selected from settings, close the wizard
        handleClose();
      } else {
        setStep('source');
      }
    } else if (step === 'preview') {
      setStep('upload');
    }
  };

  if (!isImportWizardOpen) return null;

  const content = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            maxWidth: step === 'preview' ? '900px' : '600px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-sans)',
                  margin: 0,
                }}
              >
                Import Secrets
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--color-text-3)',
                  fontFamily: 'var(--font-mono)',
                  margin: '4px 0 0 0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {step === 'source' && 'Choose Source'}
                {step === 'upload' && `Import from ${importSource === 'bitwarden' ? 'Bitwarden' : '1Password'}`}
                {step === 'preview' && 'Review & Select'}
                {step === 'importing' && 'Importing...'}
                {step === 'complete' && 'Complete'}
              </p>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 32,
                height: 32,
                display: 'grid',
                placeItems: 'center',
                border: '1px solid var(--color-border)',
                background: 'none',
                color: 'var(--color-text-3)',
                cursor: 'pointer',
                transition: 'all 140ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border-2)';
                e.currentTarget.style.color = 'var(--color-text)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.color = 'var(--color-text-3)';
              }}
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
            {step === 'source' && <SourceSelector onSelect={handleSourceSelect} />}
            {step === 'upload' && importSource && (
              <FileDropZone source={importSource} onParsed={handleFileParsed} onBack={handleBack} />
            )}
            {step === 'preview' && parseResult && (
              <ImportPreview
                candidates={candidates}
                onBack={handleBack}
                onImport={handleStartImport}
              />
            )}
            {step === 'importing' && (
              <ImportProgress candidates={candidates} onComplete={handleImportComplete} />
            )}
            {step === 'complete' && importResult && (
              <ImportComplete result={importResult} onClose={handleClose} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
};
