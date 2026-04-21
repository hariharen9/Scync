import React, { useState, useEffect } from 'react';
import { FiCopy, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { useClipboard } from '../hooks/useClipboard';

interface MaskedValueProps {
  value: string;
  isRevealed?: boolean;
  onRevealToggled?: (revealed: boolean) => void;
  className?: string;
}

export const MaskedValue: React.FC<MaskedValueProps> = ({ 
  value, 
  isRevealed = false, 
  onRevealToggled,
  className = ''
}) => {
  const [revealed, setRevealed] = useState(isRevealed);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { copy, hasCopied } = useClipboard();

  useEffect(() => {
    setRevealed(isRevealed);
  }, [isRevealed]);

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

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <code className={`font-mono text-sm tracking-widest ${revealed ? 'text-value-revealed' : 'text-value-masked'}`}>
        {revealed ? value : '●●●●●●●●●●●●●●●●●●●●'}
      </code>

      <div className="flex items-center gap-1">
        <button 
          onClick={handleCopy}
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          title="Copy to clipboard"
        >
          {hasCopied ? <FiCheck className="text-green-500" /> : <FiCopy />}
        </button>
        
        <button 
          onClick={toggleReveal}
          className="flex h-7 w-7 items-center justify-center rounded text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          title={revealed ? "Hide value" : "Reveal value"}
        >
          {revealed ? <FiEyeOff /> : <FiEye />}
        </button>

        {countdown !== null && (
          <span className="ml-1 text-xs text-zinc-500">{countdown}s</span>
        )}
      </div>
    </div>
  );
};
