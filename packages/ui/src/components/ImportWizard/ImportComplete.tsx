// Import Complete - Step 5: Success summary

import React from 'react';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';
import type { ImportResult } from '@scync/core';

interface ImportCompleteProps {
  result: ImportResult;
  onClose: () => void;
}

export const ImportComplete: React.FC<ImportCompleteProps> = ({ result, onClose }) => {
  const hasErrors = result.failed > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px',
        gap: 24,
      }}
    >
      {/* Success/Warning icon */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: hasErrors ? 'var(--color-yellow-bg)' : 'var(--color-green-bg)',
          border: `2px solid ${hasErrors ? 'var(--color-yellow-border)' : 'var(--color-green-border)'}`,
          display: 'grid',
          placeItems: 'center',
          color: hasErrors ? 'var(--color-yellow)' : 'var(--color-green)',
        }}
      >
        {hasErrors ? <FiAlertTriangle size={32} /> : <FiCheckCircle size={32} />}
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center' }}>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            margin: 0,
          }}
        >
          {hasErrors ? 'Import Completed with Warnings' : 'Import Successful!'}
        </h3>
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-2)',
            fontFamily: 'var(--font-sans)',
            margin: '8px 0 0 0',
          }}
        >
          {result.imported} secret{result.imported !== 1 ? 's' : ''} imported successfully
          {hasErrors && `, ${result.failed} failed`}
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: hasErrors ? '1fr 1fr' : '1fr',
          gap: 16,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <div
          style={{
            padding: '16px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--color-green)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {result.imported}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--color-text-3)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: 4,
            }}
          >
            Imported
          </div>
        </div>

        {hasErrors && (
          <div
            style={{
              padding: '16px',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--color-yellow)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {result.failed}
            </div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--color-text-3)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginTop: 4,
              }}
            >
              Failed
            </div>
          </div>
        )}
      </div>

      {/* Error list */}
      {hasErrors && result.errors.length > 0 && (
        <div
          style={{
            width: '100%',
            maxWidth: 500,
            padding: '16px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-yellow-border)',
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text)',
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
            }}
          >
            Errors:
          </div>
          {result.errors.map((error, idx) => (
            <div
              key={idx}
              style={{
                fontSize: 11,
                color: 'var(--color-text-2)',
                fontFamily: 'var(--font-mono)',
                padding: '4px 0',
                borderBottom:
                  idx < result.errors.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Next steps */}
      <div
        style={{
          padding: '16px',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          maxWidth: 500,
          width: '100%',
        }}
      >
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-text-2)',
            fontFamily: 'var(--font-sans)',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: 'var(--color-text)' }}>Next steps:</strong>
          <br />
          • Review your imported secrets in the vault
          <br />
          • Assign secrets to projects if needed
          <br />
          • Update environments (Personal/Staging/Production)
          <br />• <strong>Delete the export file from your computer</strong>
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          padding: '10px 24px',
          background: 'white',
          color: '#080808',
          border: 'none',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'var(--font-sans)',
          cursor: 'pointer',
          transition: 'background 140ms',
          marginTop: 8,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#f0f0f0')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
      >
        Done
      </button>
    </div>
  );
};
