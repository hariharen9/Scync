import React, { useState, useEffect } from 'react';
import { FiCopy, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useClipboard } from '../hooks/useClipboard';

interface MaskedValueProps {
  value: string;
  isRevealed?: boolean;
  onRevealToggled?: (revealed: boolean) => void;
  className?: string;
  compact?: boolean;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({
  value,
  isRevealed = false,
  onRevealToggled,
  className = '',
  compact = false,
}) => {
  const [revealed, setRevealed] = useState(isRevealed);
  const [countdown, setCountdown] = useState<number | null>(null);
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

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copy(value);
  };

  const iconBtnClass = `flex items-center justify-center rounded-lg transition-all duration-200 ${
    compact ? 'h-6 w-6' : 'h-7 w-7'
  } text-text-muted hover:bg-hover hover:text-text-secondary`;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <AnimatePresence mode="wait">
        <motion.code
          key={revealed ? 'revealed' : 'masked'}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className={`font-mono truncate ${compact ? 'text-xs' : 'text-sm'} ${
            revealed
              ? 'text-value-revealed'
              : 'text-text-muted tracking-[0.3em]'
          }`}
        >
          {revealed ? value : '••••••••••••'}
        </motion.code>
      </AnimatePresence>

      <div className="flex items-center gap-0.5 shrink-0">
        <button onClick={handleCopy} className={iconBtnClass} title="Copy">
          {hasCopied ? (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
              <FiCheck className="text-success" style={{ width: compact ? 12 : 14, height: compact ? 12 : 14 }} />
            </motion.div>
          ) : (
            <FiCopy style={{ width: compact ? 12 : 14, height: compact ? 12 : 14 }} />
          )}
        </button>

        <button onClick={toggleReveal} className={iconBtnClass} title={revealed ? 'Hide' : 'Reveal'}>
          {revealed ? (
            <FiEyeOff style={{ width: compact ? 12 : 14, height: compact ? 12 : 14 }} />
          ) : (
            <FiEye style={{ width: compact ? 12 : 14, height: compact ? 12 : 14 }} />
          )}
        </button>

        {countdown !== null && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-0.5 rounded bg-elevated px-1 py-0.5 text-[9px] font-mono font-bold text-text-muted"
          >
            {countdown}s
          </motion.span>
        )}
      </div>
    </div>
  );
};
