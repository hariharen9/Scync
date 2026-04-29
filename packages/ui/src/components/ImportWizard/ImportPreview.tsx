// Step 3: Preview & Select

import React, { useState } from 'react';
import { FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import type { ImportCandidate } from '@scync/core';

interface Props {
  candidates: ImportCandidate[];
  onBack: () => void;
  onImport: (selected: ImportCandidate[]) => void;
}

export const ImportPreview: React.FC<Props> = ({ candidates: initialCandidates, onBack, onImport }) => {
  const [candidates, setCandidates] = useState(initialCandidates);
  const [selectAll, setSelectAll] = useState(true);

  const selectedCount = candidates.filter(c => c.selected).length;

  const handleToggleAll = () => {
    const newValue = !selectAll;
    setSelectAll(newValue);
    setCandidates(candidates.map(c => ({ ...c, selected: newValue })));
  };

  const handleToggle = (localId: string) => {
    setCandidates(candidates.map(c =>
      c.localId === localId ? { ...c, selected: !c.selected } : c
    ));
  };

  const handleImport = () => {
    const selected = candidates.filter(c => c.selected);
    if (selected.length > 0) {
      onImport(selected);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Summary */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{ fontSize: '14px', color: 'var(--color-text-2)', fontFamily: 'var(--font-sans)' }}>
          <strong>{candidates.length} secrets found</strong>
          {initialCandidates.length > candidates.length && ` · ${initialCandidates.length - candidates.length} skipped`}
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <button
          onClick={handleToggleAll}
          style={{
            padding: '6px 12px',
            border: '1px solid var(--color-border)',
            background: 'none',
            color: 'var(--color-text-2)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 140ms',
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-border-2)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border)'}
        >
          {selectAll ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          <thead>
            <tr style={{ background: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)', width: '40px' }}></th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)' }}>NAME</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)' }}>SERVICE</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)' }}>TYPE</th>
              <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-text-3)' }}>ENV</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr
                key={candidate.localId}
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  background: candidate.selected ? 'none' : 'var(--color-surface-2)',
                  opacity: candidate.selected ? 1 : 0.5,
                }}
              >
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={candidate.selected}
                    onChange={() => handleToggle(candidate.localId)}
                    style={{ cursor: 'pointer' }}
                  />
                </td>
                <td style={{ padding: '10px', color: 'var(--color-text)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {candidate.name}
                    {candidate.warning && (
                      <FiAlertTriangle size={12} style={{ color: '#f59e0b' }} title={candidate.warning} />
                    )}
                  </div>
                </td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      background: 'var(--color-surface-3)',
                      border: '1px solid var(--color-border)',
                      fontSize: '10px',
                      color: 'var(--color-text-2)',
                    }}
                  >
                    {candidate.service}
                  </span>
                </td>
                <td style={{ padding: '10px', color: 'var(--color-text-2)' }}>{candidate.type}</td>
                <td style={{ padding: '10px', color: 'var(--color-text-3)' }}>{candidate.environment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
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

        <button
          onClick={handleImport}
          disabled={selectedCount === 0}
          style={{
            padding: '8px 20px',
            background: selectedCount === 0 ? 'var(--color-surface-3)' : 'white',
            color: selectedCount === 0 ? 'var(--color-text-3)' : '#080808',
            border: 'none',
            fontSize: '12px',
            fontWeight: 700,
            cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-sans)',
            transition: 'all 140ms',
          }}
          onMouseEnter={(e) => {
            if (selectedCount > 0) e.currentTarget.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            if (selectedCount > 0) e.currentTarget.style.background = 'white';
          }}
        >
          Import {selectedCount} Secret{selectedCount !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
};
