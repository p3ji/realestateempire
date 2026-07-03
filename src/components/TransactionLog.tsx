import React from 'react';
import type { Transaction } from '../types';
import { formatCurrency } from '../utils';
import { History, TrendingUp, TrendingDown } from 'lucide-react';

interface TransactionLogProps {
  transactions: Transaction[];
}

export const TransactionLog: React.FC<TransactionLogProps> = ({ transactions }) => {
  const getCategoryBadge = (category: string) => {
    let color = 'var(--text-secondary)';
    let bg = 'rgba(255,255,255,0.04)';

    switch(category) {
      case 'salary':
        color = 'var(--cyber-blue)';
        bg = 'rgba(0, 210, 255, 0.08)';
        break;
      case 'rent':
        color = 'var(--cyber-green)';
        bg = 'rgba(57, 255, 20, 0.08)';
        break;
      case 'purchase':
        color = 'var(--cyber-orange)';
        bg = 'rgba(255, 157, 0, 0.08)';
        break;
      case 'sale':
        color = 'var(--cyber-green)';
        bg = 'rgba(57, 255, 20, 0.08)';
        break;
      case 'mortgage':
        color = 'var(--cyber-red)';
        bg = 'rgba(255, 0, 85, 0.08)';
        break;
      case 'tax':
        color = 'var(--cyber-purple)';
        bg = 'rgba(189, 0, 255, 0.08)';
        break;
      case 'renovation':
        color = 'var(--cyber-blue)';
        bg = 'rgba(0, 210, 255, 0.08)';
        break;
    }

    return (
      <span style={{
        fontSize: '9px',
        fontWeight: 700,
        color,
        background: bg,
        padding: '3px 8px',
        borderRadius: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {category}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
        <History size={20} style={{ color: 'var(--cyber-blue)' }} />
        <h3 className="hud-font" style={{ margin: 0, fontSize: '16px', color: '#fff', textTransform: 'uppercase' }}>
          Transaction Audit Trail
        </h3>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '10px',
        paddingRight: '4px'
      }}>
        {transactions.length === 0 ? (
          <div style={{ 
            padding: '30px 16px', 
            textAlign: 'center', 
            border: '1px dashed var(--border-color)', 
            borderRadius: '8px', 
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            No ledger transactions recorded.
          </div>
        ) : (
          transactions.map(tx => {
            const isPositive = tx.amount >= 0;
            return (
              <div 
                key={tx.id}
                className="glass-panel"
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(25, 27, 44, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, marginRight: '16px' }}>
                  {/* Indicator Icon */}
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isPositive ? 'rgba(57, 255, 20, 0.05)' : 'rgba(255, 0, 85, 0.05)',
                    color: isPositive ? 'var(--cyber-green)' : 'var(--cyber-red)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  </div>

                  {/* Description & Date */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', lineHeight: '1.4' }}>
                      {tx.description}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span className="hud-font" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                        {tx.date}
                      </span>
                      {getCategoryBadge(tx.category)}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div className="hud-font" style={{ 
                  fontSize: '14px', 
                  fontWeight: 700, 
                  color: isPositive ? 'var(--cyber-green)' : 'var(--cyber-red)',
                  whiteSpace: 'nowrap'
                }}>
                  {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
