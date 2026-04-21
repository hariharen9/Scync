import { useState, useCallback } from 'react';

export function useClipboard() {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      if (navigator.clipboard) {
         await navigator.clipboard.writeText(text);
      }
      setHasCopied(true);
      
      // Reset the "copied" state after 2 seconds
      setTimeout(() => {
        setHasCopied(false);
      }, 2000);

      // Spec: Clear clipboard after 30 seconds
      setTimeout(async () => {
        try {
          if (navigator.clipboard) {
            const current = await navigator.clipboard.readText();
            if (current === text) {
              await navigator.clipboard.writeText('');
            }
          }
        } catch (e) {
          // Ignore
        }
      }, 30000);

    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  }, []);

  return { copy, hasCopied };
}
