import React from 'react';
import type { GameState } from '../types';
import { formatCurrency, getMonthName } from '../utils';
import { Play, Pause, FastForward, DollarSign, Calendar, TrendingUp, History, Trophy, RotateCcw } from 'lucide-react';

interface SidebarProps {
  state: GameState;
  onSelectProperty: (id: string | null) => void;
  onSetSpeed: (speed: number) => void;
  onReset: () => void;
  onOpenPanel: (panel: 'transactions' | 'leaderboard' | null) => void;
  activePanel: 'transactions' | 'leaderboard' | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  state,
  onSelectProperty,
  onSetSpeed,
  onReset,
  onOpenPanel,
  activePanel,
}) => {
  const { player, properties, gameDate, speed } = state;

  // Calculate dynamic cash flow metrics
  const playerProperties = properties.filter(p => p.ownerId === 'player');
  
  const salaryIncome = Math.round(player.salary / 12);
  const rentalIncome = playerProperties.reduce((sum, p) => sum + Math.round(p.rent * p.occupancyRate), 0);
  const totalIncome = salaryIncome + rentalIncome;

  const debtExpense = player.debt > 0 ? player.monthlyDebtPayment : 0;
  const taxExpense = playerProperties.reduce((sum, p) => {
    // centretown has 1.1% tax, others 1.0%
    const taxRate = p.id.split('_')[1] === 'centretown' || p.id.split('_')[1] === 'sandyhill' ? 0.011 : 0.010;
    return sum + Math.round((p.marketValue * taxRate) / 12);
  }, 0);
  const maintenanceExpense = playerProperties.reduce((sum, p) => {
    const conditionPenalty = (100 - p.condition) * 0.01;
    return sum + Math.round((p.marketValue * (0.008 + conditionPenalty)) / 12);
  }, 0);
  const mortgageExpense = playerProperties.reduce((sum, p) => {
    return sum + (p.mortgage ? Math.round(p.mortgage.monthlyPayment) : 0);
  }, 0);
  const totalExpense = debtExpense + taxExpense + maintenanceExpense + mortgageExpense;
  const netCashFlow = totalIncome - totalExpense;

  // Calculate Net Worth
  let totalEquity = player.cash;
  playerProperties.forEach(p => {
    const loan = p.mortgage ? p.mortgage.remainingBalance : 0;
    totalEquity += (p.marketValue - loan);
  });
  totalEquity -= player.debt;

  return (
    <div style={{
      width: '360px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      flexShrink: 0,
      zIndex: 10,
      boxSizing: 'border-box'
    }}>
      {/* HUD Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <h2 className="cyber-header-glow hud-font" style={{
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--cyber-blue)',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Empire Command
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span style={{ marginRight: '8px' }}>ARCHETYPE:</span>
          <span className="hud-font" style={{ color: '#fff', fontWeight: 600 }}>{player.archetype.toUpperCase()}</span>
        </div>
      </div>

      {/* Date & Speed Loop Controller */}
      <div style={{ padding: '16px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} style={{ color: 'var(--cyber-blue)' }} />
            <span className="hud-font" style={{ fontSize: '15px', color: '#fff', fontWeight: 700 }}>
              {getMonthName(gameDate).toUpperCase()}
            </span>
          </div>
          <span className="hud-font" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            DAY {gameDate.split('-')[2]}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => onSetSpeed(0)}
            className={`btn-neon ${speed === 0 ? 'active' : ''}`}
            style={{ 
              flex: 1, 
              padding: '6px',
              '--neon-color': speed === 0 ? 'var(--cyber-red)' : 'var(--text-muted)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            } as React.CSSProperties}
          >
            <Pause size={14} />
          </button>
          <button 
            onClick={() => onSetSpeed(1)}
            className={`btn-neon ${speed === 1 ? 'active' : ''}`}
            style={{ 
              flex: 1.5, 
              padding: '6px',
              '--neon-color': speed === 1 ? 'var(--cyber-blue)' : 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px'
            } as React.CSSProperties}
          >
            <Play size={12} /> 1X
          </button>
          <button 
            onClick={() => onSetSpeed(2)}
            className={`btn-neon ${speed === 2 ? 'active' : ''}`}
            style={{ 
              flex: 1.5, 
              padding: '6px',
              '--neon-color': speed === 2 ? 'var(--cyber-orange)' : 'var(--text-secondary)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px'
            } as React.CSSProperties}
          >
            <FastForward size={12} /> 2X
          </button>
        </div>
      </div>

      {/* Main Financial Readouts */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
        {/* Net Worth */}
        <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>NET WORTH</span>
            <TrendingUp size={14} style={{ color: 'var(--cyber-blue)' }} />
          </div>
          <div className="hud-font" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--cyber-blue)', textShadow: '0 0 10px rgba(0, 210, 255, 0.2)' }}>
            {formatCurrency(totalEquity)}
          </div>
        </div>

        {/* Available Cash */}
        <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>AVAILABLE CASH</span>
            <DollarSign size={14} style={{ color: 'var(--cyber-green)' }} />
          </div>
          <div className="hud-font" style={{ fontSize: '24px', fontWeight: 900, color: 'var(--cyber-green)', textShadow: '0 0 10px rgba(57, 255, 20, 0.2)' }}>
            {formatCurrency(player.cash)}
          </div>
        </div>

        {/* Monthly Cash Flow */}
        <div style={{ padding: '4px 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>EST. MONTHLY CASH FLOW</span>
            <span className="hud-font" style={{ 
              fontSize: '14px', 
              fontWeight: 700, 
              color: netCashFlow >= 0 ? 'var(--cyber-green)' : 'var(--cyber-red)'
            }}>
              {netCashFlow >= 0 ? '+' : ''}{formatCurrency(netCashFlow)}/mo
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Income (Job + Rents):</span>
              <span style={{ color: '#fff' }}>+{formatCurrency(totalIncome)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Expenses (Debt + Tax + Maint + Loans):</span>
              <span style={{ color: 'var(--cyber-red)' }}>-{formatCurrency(totalExpense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main HUD Options buttons */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={() => onOpenPanel(activePanel === 'leaderboard' ? null : 'leaderboard')}
          style={{
            flex: 1,
            padding: '12px',
            background: activePanel === 'leaderboard' ? 'var(--bg-tertiary)' : 'transparent',
            border: 'none',
            borderRight: '1px solid var(--border-color)',
            color: activePanel === 'leaderboard' ? 'var(--cyber-blue)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <Trophy size={14} /> LEADERBOARD
        </button>
        <button 
          onClick={() => onOpenPanel(activePanel === 'transactions' ? null : 'transactions')}
          style={{
            flex: 1,
            padding: '12px',
            background: activePanel === 'transactions' ? 'var(--bg-tertiary)' : 'transparent',
            border: 'none',
            color: activePanel === 'transactions' ? 'var(--cyber-blue)' : '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <History size={14} /> TX AUDIT
        </button>
      </div>

      {/* Portfolio Property List */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '16px 24px 8px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
          <span>PORTFOLIO ASSETS</span>
          <span>{playerProperties.length} PROPERTIES</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {playerProperties.length === 0 ? (
            <div style={{ 
              padding: '30px 16px', 
              textAlign: 'center', 
              border: '1px dashed var(--border-color)', 
              borderRadius: '8px', 
              color: 'var(--text-muted)',
              fontSize: '13px'
            }}>
              No assets acquired yet.<br />Click map nodes to buy listings.
            </div>
          ) : (
            playerProperties.map(prop => (
              <div 
                key={prop.id}
                onClick={() => onSelectProperty(prop.id)}
                className="glass-panel"
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.04)',
                  transition: 'all 0.2s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: state.selectedPropertyId === prop.id ? 'rgba(0, 210, 255, 0.05)' : 'rgba(25, 27, 44, 0.2)',
                  borderColor: state.selectedPropertyId === prop.id ? 'var(--cyber-blue)' : 'rgba(255,255,255,0.04)'
                }}
                onMouseEnter={(e) => {
                  if (state.selectedPropertyId !== prop.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (state.selectedPropertyId !== prop.id) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
                  }
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                    {prop.address}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {prop.neighborhood} &bull; <span style={{ textTransform: 'uppercase' }}>{prop.type}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="hud-font" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--cyber-green)' }}>
                    +{formatCurrency(prop.rent)}/mo
                  </div>
                  <div style={{ fontSize: '10px', color: prop.mortgage ? 'var(--cyber-orange)' : 'var(--text-muted)' }}>
                    {prop.mortgage ? 'MORTGAGED' : 'FREE & CLEAR'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reset Career footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
        <button 
          onClick={() => {
            if (confirm('Are you sure you want to reset your career? All progress will be deleted.')) {
              onReset();
            }
          }}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            color: 'var(--cyber-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '11px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <RotateCcw size={12} /> ABANDON CAREER
        </button>
      </div>
    </div>
  );
};
