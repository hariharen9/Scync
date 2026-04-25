import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiKey, FiLock, FiToggleRight, FiSettings, FiPlus, FiBox, FiCheck } from 'react-icons/fi';
import { useUIStore } from '../stores/uiStore';
import { useVaultStore } from '../stores/vaultStore';
import { useProjectStore } from '../stores/projectStore';

export const CommandBar: React.FC = () => {
  const { isCommandBarOpen, closeCommandBar, openSettingsModal, openAddModal, openAddProjectModal, settings, updateSettings } = useUIStore();
  const { storedSecrets, decryptValue, lock } = useVaultStore();
  const { projects } = useProjectStore();
  
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-focus and scroll lock
  useEffect(() => {
    if (isCommandBarOpen) {
      setQuery('');
      setSelectedIndex(0);
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 10);
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isCommandBarOpen]);

  const actions = useMemo(() => [
    { id: 'action-lock', type: 'action', label: 'Lock Vault', subLabel: 'Secure your data instantly', icon: <FiLock />, onSelect: () => { lock(); closeCommandBar(); } },
    { id: 'action-theme', type: 'action', label: `Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} Mode`, subLabel: 'Toggle visual appearance', icon: <FiToggleRight />, onSelect: () => { updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }); closeCommandBar(); } },
    { id: 'action-settings', type: 'action', label: 'Open Settings', subLabel: 'Configuration & security', icon: <FiSettings />, onSelect: () => { openSettingsModal(); closeCommandBar(); } },
    { id: 'action-add', type: 'action', label: 'Add New Secret', subLabel: 'Store a new credential', icon: <FiPlus />, onSelect: () => { openAddModal(); closeCommandBar(); } },
    { id: 'action-project', type: 'action', label: 'Create New Project', subLabel: 'Organize your infrastructure', icon: <FiBox />, onSelect: () => { openAddProjectModal(); closeCommandBar(); } },
  ], [settings.theme, lock, updateSettings, openSettingsModal, openAddModal, openAddProjectModal, closeCommandBar]);

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase();
    
    // Secrets First
    const matchingSecrets = storedSecrets
      .filter(s => s.name.toLowerCase().includes(q) || s.environment.toLowerCase().includes(q))
      .map(s => {
        const project = projects.find(p => p.id === s.projectId);
        return {
          id: s.id,
          type: 'secret',
          label: s.name,
          subLabel: `${project?.name || 'No Project'} • ${s.environment}`,
          icon: <FiKey />,
          onSelect: async () => {
            const dec = await decryptValue(s.id);
            if (dec) {
              navigator.clipboard.writeText(dec.value);
              setCopiedId(s.id);
              setTimeout(() => {
                setCopiedId(null);
                closeCommandBar();
              }, 800);
            }
          }
        };
      });

    // Actions Second
    const matchingActions = actions.filter(a => a.label.toLowerCase().includes(q));

    return [...matchingSecrets, ...matchingActions];
  }, [query, storedSecrets, projects, actions, decryptValue, closeCommandBar]);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isCommandBarOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      } else if (e.key === 'Escape') {
        closeCommandBar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandBarOpen, filteredItems, selectedIndex, closeCommandBar]);

  // Keep selected item in view
  useEffect(() => {
    const selectedEl = scrollRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isCommandBarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', paddingTop: '18vh' }}>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCommandBar}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          />

          {/* Command Bar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'relative', width: '90%', maxWidth: 580, 
              background: 'var(--color-surface)', border: '1px solid var(--color-border-2)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)', borderRadius: 0,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
              height: 'fit-content'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--color-border)' }}>
              <FiSearch size={18} color="var(--color-text-3)" style={{ marginRight: 14 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search secrets or commands..."
                style={{
                  width: '100%', background: 'none', border: 'none', outline: 'none',
                  color: 'var(--color-text)', fontSize: 15, fontFamily: 'var(--font-sans)'
                }}
              />
            </div>

            <div 
              ref={scrollRef}
              data-lenis-prevent
              style={{ 
                maxHeight: 380, 
                overflowY: 'auto', 
                padding: '4px 0',
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--color-border) transparent'
              }}
              className="brutalist-scroll"
            >
              {filteredItems.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 }}>
                  No results found for "{query}"
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => item.onSelect()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      padding: '8px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: selectedIndex === idx ? 'var(--color-surface-2)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.08s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ 
                        width: 28, height: 28, display: 'grid', placeItems: 'center', 
                        background: selectedIndex === idx ? 'var(--color-text)' : 'var(--color-surface-3)',
                        color: selectedIndex === idx ? 'var(--color-bg)' : 'var(--color-text-2)',
                        transition: 'all 0.08s'
                      }}>
                        {item.id === copiedId ? <FiCheck size={14} /> : item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: selectedIndex === idx ? 'var(--color-text)' : 'var(--color-text-2)' }}>
                          {item.label}
                        </div>
                        {item.subLabel && (
                          <div style={{ fontSize: 10.5, color: 'var(--color-text-muted)', marginTop: 1 }}>
                            {item.subLabel}
                          </div>
                        )}
                      </div>
                    </div>
                    {selectedIndex === idx && (
                      <div style={{ fontSize: 10, background: 'var(--color-border)', padding: '4px 8px', borderRadius: 4, letterSpacing: '0.05em', color: 'var(--color-text-3)' }}>
                        {item.type === 'secret' ? 'ENTER TO COPY' : 'ENTER TO RUN'}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 16, background: 'var(--color-surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, background: 'var(--color-border)', padding: '2px 6px', borderRadius: 3, color: 'var(--color-text-3)' }}>↑↓</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Navigate</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, background: 'var(--color-border)', padding: '2px 6px', borderRadius: 3, color: 'var(--color-text-3)' }}>↵</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Select</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, background: 'var(--color-border)', padding: '2px 6px', borderRadius: 3, color: 'var(--color-text-3)' }}>ESC</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
