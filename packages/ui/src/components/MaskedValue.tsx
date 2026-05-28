import React, { useState, useEffect } from 'react';
import { FiCopy, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { useClipboard } from '../hooks/useClipboard';

interface MaskedValueProps {
  value: string;
  isRevealed?: boolean;
  onRevealToggled?: (revealed: boolean) => void;
  className?: string;
  compact?: boolean;
  onCopy?: () => Promise<string> | string;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({
  value,
  isRevealed = false,
  onRevealToggled,
  className = '',
  compact = false,
  onCopy,
}) => {
  const [revealed, setRevealed] = useState(isRevealed);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const { copy, hasCopied } = useClipboard();

  useEffect(() => { setRevealed(isRevealed); }, [isRevealed]);

  useEffect(() => {
    if (revealed) {
      setCountdown(15);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev && prev > 1) return prev - 1;
          setRevealed(false);
          onRevealToggled?.(false);
          return null;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [revealed, onRevealToggled]);

  const toggleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !revealed;
    setRevealed(next);
    onRevealToggled?.(next);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      setIsCopying(true);
      try {
        const val = await onCopy();
        copy(val);
      } catch (err) {
        console.error('Failed to decrypt and copy value:', err);
      } finally {
        setIsCopying(false);
      }
    } else {
      copy(value);
    }
  };

  const iconBtnStyle: React.CSSProperties = {
    display: 'grid', placeItems: 'center',
    width: compact ? 22 : 26, height: compact ? 22 : 26,
    background: 'none', border: 'none',
    color: 'var(--color-text-3)', cursor: 'pointer',
    transition: 'color 140ms',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className={className}>
      <code style={{
        fontFamily: 'var(--font-mono)',
        fontSize: compact ? '11px' : '12.5px',
        color: revealed ? 'var(--color-text-2)' : 'var(--color-text-3)',
        letterSpacing: revealed ? '0' : '0.2em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        flex: 1,
        transition: 'color 140ms',
      }}>
        {revealed ? value : '••••••••••••'}
      </code>

      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
        <button
          onClick={handleCopy}
          disabled={isCopying}
          style={iconBtnStyle}
          title="Copy"
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
        >
          {hasCopied ? (
            <FiCheck style={{ width: compact ? 11 : 13, height: compact ? 11 : 13, color: 'var(--color-green)' }} />
          ) : isCopying ? (
            <div style={{
              width: compact ? 10 : 12, height: compact ? 10 : 12,
              borderRadius: '50%', border: '2px solid var(--color-border)',
              borderTopColor: 'var(--color-green)',
              animation: 'spin 0.8s linear infinite'
            }} />
          ) : (
            <FiCopy style={{ width: compact ? 11 : 13, height: compact ? 11 : 13 }} />
          )}
        </button>

        <button
          onClick={toggleReveal}
          style={iconBtnStyle}
          title={revealed ? 'Hide' : 'Reveal'}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-3)'}
        >
          {revealed ? (
            <FiEyeOff style={{ width: compact ? 11 : 13, height: compact ? 11 : 13 }} />
          ) : (
            <FiEye style={{ width: compact ? 11 : 13, height: compact ? 11 : 13 }} />
          )}
        </button>

        {countdown !== null && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 500,
            color: 'var(--color-text-3)', padding: '1px 4px',
            background: 'var(--color-surface-2)', border: '1px solid var(--color-border)',
            marginLeft: 2,
          }}>
            {countdown}s
          </span>
        )}
      </div>
    </div>
  );
};
