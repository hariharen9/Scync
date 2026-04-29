// Step 2: File Upload & Instructions

import React, { useState, useRef } from 'react';
import { FiUpload, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import { parseBitwardenExport, parse1PasswordCsv, parse1PasswordOnePux, type ImportParseResult } from '@scync/core';

interface Props {
  source: 'bitwarden' | 'onepassword';
  onParsed: (result: ImportParseResult) => void;
  onBack: () => void;
}

export const FileDropZone: React.FC<Props> = ({ source, onParsed, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsProcessing(true);

    try {
      if (source === 'bitwarden') {
        if (!file.name.endsWith('.json')) {
          throw new Error('Please select a .json file');
        }
        const text = await file.text();
        const result = parseBitwardenExport(text);
        onParsed(result);
      } else {
        // 1Password
        if (file.name.endsWith('.csv')) {
          const text = await file.text();
          const result = parse1PasswordCsv(text);
          onParsed(result);
        } else if (file.name.endsWith('.1pux')) {
          const buffer = await file.arrayBuffer();
          const result = await parse1PasswordOnePux(buffer);
          onParsed(result);
        } else {
          throw new Error('Please select a .csv or .1pux file');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      {/* Instructions */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '12px', fontFamily: 'var(--font-sans)' }}>
          Export from {source === 'bitwarden' ? 'Bitwarden' : '1Password'}
        </h3>
        {source === 'bitwarden' ? (
          <ol style={{ fontSize: '13px', color: 'var(--color-text-2)', lineHeight: 1.6, paddingLeft: '20px', fontFamily: 'var(--font-sans)' }}>
            <li>Open Bitwarden → Account Settings</li>
            <li>Click "Export Vault"</li>
            <li>File Format: <strong>JSON (unencrypted)</strong></li>
            <li>Enter your master password to confirm</li>
            <li>Save the .json file</li>
          </ol>
        ) : (
          <ol style={{ fontSize: '13px', color: 'var(--color-text-2)', lineHeight: 1.6, paddingLeft: '20px', fontFamily: 'var(--font-sans)' }}>
            <li>Open 1Password → File → Export</li>
            <li>Choose format: <strong>CSV</strong> or <strong>.1pux</strong></li>
            <li>Enter your master password</li>
            <li>Save the export file</li>
          </ol>
        )}
        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          <FiAlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '12px', color: '#ef4444', margin: 0, fontFamily: 'var(--font-sans)' }}>
            The exported file is unencrypted. Delete it after importing.
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? 'var(--color-border-2)' : 'var(--color-border)'}`,
          background: isDragging ? 'var(--color-surface-3)' : 'var(--color-surface-2)',
          padding: '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 140ms',
          marginBottom: '16px',
        }}
      >
        <FiUpload size={32} style={{ color: 'var(--color-text-3)', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 600, margin: '0 0 4px 0', fontFamily: 'var(--font-sans)' }}>
          {isProcessing ? 'Processing...' : fileName ? fileName : `Drag your ${source === 'bitwarden' ? '.json' : '.csv or .1pux'} file here`}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--color-text-3)', margin: 0, fontFamily: 'var(--font-mono)' }}>
          or click to browse
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={source === 'bitwarden' ? '.json' : '.csv,.1pux'}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px' }}>
          <p style={{ fontSize: '13px', color: '#ef4444', margin: 0, fontFamily: 'var(--font-sans)' }}>{error}</p>
        </div>
      )}

      {/* Security Note */}
      <div style={{ padding: '12px', background: 'var(--color-surface-3)', border: '1px solid var(--color-border)', display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '16px' }}>
        <FiLock size={14} style={{ color: 'var(--color-green)', flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '11px', color: 'var(--color-text-3)', margin: 0, fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
          This file never leaves your device. Parsing happens in your browser.
        </p>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          border: '1px solid var(--color-border)',
          background: 'none',
          color: 'var(--color-text-2)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'var(--font-sans)',
          transition: 'all 140ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border-2)';
          e.currentTarget.style.color = 'var(--color-text)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)';
          e.currentTarget.style.color = 'var(--color-text-2)';
        }}
      >
        <FiArrowLeft size={14} />
        Back
      </button>
    </div>
  );
};

const FiLock = ({ size, style }: { size: number; style: React.CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);
