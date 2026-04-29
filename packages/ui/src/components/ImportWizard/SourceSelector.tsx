// Step 1: Source Selection

import React from 'react';
import { FiLock, FiKey } from 'react-icons/fi';

interface Props {
  onSelect: (source: 'bitwarden' | 'onepassword') => void;
}

export const SourceSelector: React.FC<Props> = ({ onSelect }) => {
  return (
    <div>
      <p style={{ fontSize: '14px', color: 'var(--color-text-2)', marginBottom: '24px', fontFamily: 'var(--font-sans)' }}>
        Where are you importing from?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Bitwarden */}
        <button
          onClick={() => onSelect('bitwarden')}
          style={{
            padding: '32px 24px',
            border: '2px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            cursor: 'pointer',
            transition: 'all 140ms',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-2)';
            e.currentTarget.style.background = 'var(--color-surface-3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.background = 'var(--color-surface-2)';
          }}
        >
          <FiLock size={32} style={{ color: 'var(--color-text)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
              Bitwarden
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              JSON export
            </div>
          </div>
        </button>

        {/* 1Password */}
        <button
          onClick={() => onSelect('onepassword')}
          style={{
            padding: '32px 24px',
            border: '2px solid var(--color-border)',
            background: 'var(--color-surface-2)',
            cursor: 'pointer',
            transition: 'all 140ms',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-2)';
            e.currentTarget.style.background = 'var(--color-surface-3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.background = 'var(--color-surface-2)';
          }}
        >
          <FiKey size={32} style={{ color: 'var(--color-text)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
              1Password
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-3)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              CSV or .1pux export
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
