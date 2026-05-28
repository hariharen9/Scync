import React, { useState, useMemo } from 'react';
import { FiCopy, FiCheck, FiDownload, FiAlertTriangle, FiGlobe, FiKey, FiCpu, FiEye, FiEyeOff } from 'react-icons/fi';
import { useClipboard } from '../hooks/useClipboard';
import { MaskedValue } from './MaskedValue';
import type { StoredSecret } from '@scync/core';

interface ServiceAccountInspectorProps {
  secret: StoredSecret;
  decryptedValue: string;
}

const cardStyle: React.CSSProperties = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  padding: '12px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-3)',
  fontFamily: 'var(--font-sans)',
};

const valueStyle: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--color-text)',
  fontFamily: 'var(--font-sans)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-2)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  textTransform: 'uppercase',
  letterSpacing: '0.03em',
  transition: 'all 120ms',
};

const copyBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-text-3)',
  cursor: 'pointer',
  padding: 0,
  display: 'grid',
  placeItems: 'center',
  width: 20,
  height: 20,
  transition: 'color 120ms',
};

const KeyValueRow: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => {
  const { copy, hasCopied } = useClipboard();

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, ...labelStyle }}>
          {icon}
          {label}
        </span>
        <button
          type="button"
          onClick={() => copy(value)}
          style={copyBtnStyle}
          title={`Copy ${label}`}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
        >
          {hasCopied ? <FiCheck size={12} color="var(--color-green)" /> : <FiCopy size={12} />}
        </button>
      </div>
      <div style={valueStyle} title={value}>
        {value}
      </div>
    </div>
  );
};

export const ServiceAccountInspector: React.FC<ServiceAccountInspectorProps> = ({ secret, decryptedValue }) => {
  const { copy, hasCopied } = useClipboard();
  const [showRaw, setShowRaw] = useState(false);

  // Attempt client-side JSON parsing
  const parsedData = useMemo(() => {
    try {
      const data = JSON.parse(decryptedValue);
      if (data && typeof data === 'object') {
        // 1. Google OAuth Client JSON (nested under 'web' or 'installed')
        const oauthParent = data.web || data.installed;
        if (oauthParent && typeof oauthParent === 'object') {
          return {
            isValid: true,
            isOAuth: true,
            projectId: oauthParent.project_id || '—',
            clientId: oauthParent.client_id || '—',
            clientSecret: oauthParent.client_secret || '—',
            clientEmail: '',
            privateKeyId: '',
            prettyJson: JSON.stringify(data, null, 2),
          };
        }

        // 2. Google Service Account JSON (flat root fields)
        return {
          isValid: true,
          isOAuth: false,
          projectId: data.project_id || '—',
          clientEmail: data.client_email || '—',
          privateKeyId: data.private_key_id || '—',
          clientId: '',
          clientSecret: '',
          prettyJson: JSON.stringify(data, null, 2),
        };
      }
    } catch (e) {}
    return { isValid: false, isOAuth: false, projectId: '', clientEmail: '', privateKeyId: '', clientId: '', clientSecret: '', prettyJson: '' };
  }, [decryptedValue]);

  const handleDownload = () => {
    try {
      const blob = new Blob([decryptedValue], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = secret.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      a.href = url;
      a.download = `${safeName || 'service_account'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to trigger download:', err);
    }
  };

  // Graceful fallback UI for invalid JSON
  if (!parsedData.isValid) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: 'var(--color-red-bg)',
          border: '1px solid rgba(239,68,68,0.2)',
          color: 'var(--color-red)',
          fontFamily: 'var(--font-sans)',
        }}>
          <FiAlertTriangle size={14} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, fontWeight: 600 }}>
            Invalid JSON Format Detected. Showing raw credentials.
          </div>
        </div>
        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          padding: '10px 12px',
        }}>
          <MaskedValue value={decryptedValue} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Dynamic Key Metric Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {parsedData.isOAuth ? (
          <>
            <KeyValueRow
              icon={<FiGlobe size={11} />}
              label="Project ID"
              value={parsedData.projectId}
            />
            <KeyValueRow
              icon={<FiCpu size={11} />}
              label="Client ID"
              value={parsedData.clientId}
            />
            <KeyValueRow
              icon={<FiKey size={11} />}
              label="Client Secret"
              value={parsedData.clientSecret}
            />
          </>
        ) : (
          <>
            <KeyValueRow
              icon={<FiGlobe size={11} />}
              label="Project ID"
              value={parsedData.projectId}
            />
            <KeyValueRow
              icon={<FiCpu size={11} />}
              label="Client Email"
              value={parsedData.clientEmail}
            />
            <KeyValueRow
              icon={<FiKey size={11} />}
              label="Private Key ID"
              value={parsedData.privateKeyId}
            />
          </>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={handleDownload}
          style={actionBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-green-border)'; e.currentTarget.style.color = 'var(--color-green)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
        >
          <FiDownload size={12} />
          Download JSON
        </button>
        <button
          type="button"
          onClick={() => copy(parsedData.prettyJson)}
          style={actionBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
        >
          {hasCopied ? <FiCheck size={12} color="var(--color-green)" /> : <FiCopy size={12} />}
          {hasCopied ? 'Copied!' : 'Copy full JSON'}
        </button>
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          style={{
            ...actionBtnStyle,
            marginLeft: 'auto'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-border-2)'; e.currentTarget.style.color = 'var(--color-text)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-2)'; }}
        >
          {showRaw ? <FiEyeOff size={12} /> : <FiEye size={12} />}
          {showRaw ? 'Hide JSON' : 'Show JSON'}
        </button>
      </div>

      {/* Pretty Code Explorer */}
      {showRaw && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={labelStyle}>JSON Code Explorer</label>
          <pre style={{
            margin: 0,
            padding: '12px 14px',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11.5,
            lineHeight: 1.6,
            overflowX: 'auto',
            maxHeight: 280,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}>
            {parsedData.prettyJson}
          </pre>
        </div>
      )}
    </div>
  );
};
