import React, { useState } from 'react';
import { ARCHETYPES } from '../constants';
import { formatCurrency } from '../utils';

interface CharacterSelectProps {
  onSelect: (name: string, archetypeKey: string) => void | Promise<void>;
}

export const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect }) => {
  const [name, setName] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('tech');
  const [loading, setLoading] = useState(false);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onSelect(name, selectedKey);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1b2035 0%, #070913 100%)',
      overflowY: 'auto',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '1000px',
        width: '100%',
        padding: '40px',
        textAlign: 'center',
        margin: 'auto'
      }}>
        <h1 className="cyber-header-glow hud-font" style={{
          fontSize: '36px',
          fontWeight: 900,
          color: 'var(--cyber-blue)',
          margin: '0 0 10px 0',
          textTransform: 'uppercase',
          letterSpacing: '3px'
        }}>
          Real Estate Empire
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '16px',
          marginBottom: '35px',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Ottawa Investment Simulator
        </p>

        <form onSubmit={handleStart}>
          <div style={{ marginBottom: '30px', textAlign: 'left', maxWidth: '400px', margin: '0 auto 35px' }}>
            <label className="hud-font" style={{
              display: 'block',
              fontSize: '12px',
              color: 'var(--cyber-blue)',
              marginBottom: '8px',
              textTransform: 'uppercase'
            }}>
              Investor Name / Firm
            </label>
            <input
              type="text"
              placeholder="Enter name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '16px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--cyber-blue)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
            />
          </div>

          <p className="hud-font" style={{
            fontSize: '14px',
            color: '#fff',
            marginBottom: '20px',
            textTransform: 'uppercase',
            textAlign: 'left'
          }}>
            Select Starting Backstory
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '40px'
          }}>
            {Object.entries(ARCHETYPES).map(([key, arch]) => {
              const isSelected = selectedKey === key;
              
              // Get details
              let desc = '';
              let location = '';
              if (key === 'tech') {
                desc = 'High income lead in the Kanata technology park. Heavy student debt.';
                location = 'Kanata Suburbs';
              } else if (key === 'server') {
                desc = 'Saved cash diligently working Elgin street pubs. Zero debt, ready to flip.';
                location = 'Centretown Core';
              } else if (key === 'heir') {
                desc = 'Inherited a rundown, high-maintenance duplex in Sandy Hill. Low income.';
                location = 'Sandy Hill Duplex';
              } else if (key === 'staffer') {
                desc = 'Public servant working at Parliament Hill. High credit rating, low savings.';
                location = 'The Glebe';
              }

              return (
                <div
                  key={key}
                  className={`archetype-card glass-panel ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedKey(key)}
                  style={{
                    padding: '24px',
                    textAlign: 'left',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: isSelected ? 'var(--cyber-green)' : 'var(--border-color)',
                    background: isSelected ? 'rgba(57, 255, 20, 0.04)' : 'rgba(25, 27, 44, 0.4)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                      {arch.archetype}
                    </h3>
                    <span style={{ fontSize: '20px' }}>
                      {key === 'tech' ? '💻' : key === 'server' ? '🍻' : key === 'heir' ? '🏚️' : '⚖️'}
                    </span>
                  </div>

                  <p style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.4',
                    minHeight: '55px',
                    marginBottom: '15px'
                  }}>
                    {desc}
                  </p>

                  <div style={{ fontSize: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Salary:</span>
                      <span className="hud-font" style={{ color: 'var(--cyber-blue)' }}>{formatCurrency(arch.salary)}/yr</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Starting Cash:</span>
                      <span className="hud-font" style={{ color: 'var(--cyber-green)' }}>{formatCurrency(arch.cash)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Student Debt:</span>
                      <span className="hud-font" style={{ color: 'var(--cyber-red)' }}>{formatCurrency(arch.debt)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Credit Score:</span>
                      <span className="hud-font" style={{ color: '#eab308' }}>{arch.creditScore}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Start Node:</span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>{location}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-neon-filled"
            style={{
              '--neon-color': 'var(--cyber-green)',
              '--neon-color-glow': 'var(--cyber-green-glow)',
              fontSize: '15px',
              padding: '12px 36px',
              letterSpacing: '2px'
            } as React.CSSProperties}
          >
            {loading ? 'SCANNING OTTAWA PROPERTY REGISTRY...' : 'COMMENCE HUSTLE'}
          </button>
        </form>
      </div>
    </div>
  );
};
