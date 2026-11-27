import React, { useState, useEffect, useMemo } from 'react';
import { FiCopy, FiCheck, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import { useClipboard } from '../hooks/useClipboard';

interface RecoveryPhraseViewerProps {
  value: string;
}

const REVEAL_SECONDS = 15;

export const RecoveryPhraseViewer: React.FC<RecoveryPhraseViewerProps> = ({ value }) => {
  const { copy } = useClipboard();
  const [revealed, setRevealed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const words = useMemo(() => {
    return value
      .trim()
      .split(/[\s,\n]+/)
      .map(w => w.replace(/^\d+[.):-]\s*/, '').trim())
      .filter(Boolean);
  }, [value]);

  useEffect(() => {
    setRevealed(false);
    setCountdown(null);
  }, [value]);

  useEffect(() => {
    if (!revealed) {
      setCountdown(null);
      return;
    }
    setCountdown(REVEAL_SECONDS);
    const iv = setInterval(() => {
      setCountdown(prev => {
        if (prev && prev > 1) return prev - 1;
        setRevealed(false);
        return null;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [revealed]);

  const handleCopyAll = () => {
    if (!revealed) return;
    copy(words.join(' '));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyWord = (word: string, idx: number) => {
    if (!revealed) return;
    copy(word);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(curr => (curr === idx ? null : curr)), 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Top Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '8px 10px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiShield size={12} color="#f59e0b" />
          <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-2)', letterSpacing: '0.07em' }}>
            {words.length}-WORD PHRASE
          </span>
          {revealed && countdown !== null && (
            <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--color-green)', background: 'rgba(16,185,129,0.1)', padding: '1px 6px' }}>
              AUTO-HIDE {countdown}s
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {revealed && (
            <button
              type="button"
              onClick={handleCopyAll}
              style={{
                background: 'none',
                border: '1px solid var(--color-border)',
                color: copiedAll ? 'var(--color-green)' : 'var(--color-text-2)',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              {copiedAll ? <><FiCheck size={11} /> COPIED</> : <><FiCopy size={11} /> COPY ALL</>}
            </button>
          )}
          <button
            type="button"
            onClick={() => setRevealed(r => !r)}
            style={{
              background: 'none',
              border: '1px solid var(--color-border)',
              color: revealed ? 'var(--color-text)' : 'var(--color-green)',
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              padding: '3px 8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {revealed ? <><FiEyeOff size={11} /> HIDE</> : <><FiEye size={11} /> REVEAL</>}
          </button>
        </div>
      </div>

      {/* Numbered Word Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 6,
      }}>
        {words.map((word, idx) => {
          const isCopied = copiedIndex === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleCopyWord(word, idx)}
              disabled={!revealed}
              title={revealed ? `Click to copy word #${idx + 1}` : 'Reveal phrase to view or copy'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '7px 8px',
                background: 'var(--color-bg)',
                border: `1px solid ${isCopied ? 'var(--color-green)' : 'var(--color-border)'}`,
                cursor: revealed ? 'pointer' : 'default',
                textAlign: 'left',
                minWidth: 0,
              }}
            >
              <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--color-text-3)', flexShrink: 0, width: 16 }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span style={{
                fontSize: 12,
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: revealed ? (isCopied ? 'var(--color-green)' : 'var(--color-text)') : 'var(--color-value-masked)',
                letterSpacing: revealed ? '0' : '0.12em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {revealed ? word : '••••••'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
