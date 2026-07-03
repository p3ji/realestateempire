import React from 'react';
import type { GameState } from '../types';
import { formatCurrency } from '../utils';
import { Trophy, Briefcase } from 'lucide-react';

interface LeaderboardProps {
  state: GameState;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ state }) => {
  const { player, competitors, properties } = state;

  // Calculate Player Net Worth
  let playerNetWorth = player.cash;
  const playerProps = properties.filter(p => p.ownerId === 'player');
  playerProps.forEach(p => {
    const loan = p.mortgage ? p.mortgage.remainingBalance : 0;
    playerNetWorth += (p.marketValue - loan);
  });
  playerNetWorth -= player.debt;

  // Compile Leaderboard entities
  const leaderboard = [
    {
      id: 'player',
      name: player.name,
      avatar: '👑',
      netWorth: playerNetWorth,
      propertyCount: playerProps.length,
      color: 'var(--cyber-green)',
      isPlayer: true
    },
    ...competitors.map(comp => {
      const compProps = properties.filter(p => p.ownerId === comp.id);
      let compNetWorth = comp.cash;
      compProps.forEach(p => {
        // AI simulates 75% leverage (mortgage balance) on their market values for net worth calculations
        compNetWorth += (p.marketValue * 0.25);
      });

      return {
        id: comp.id,
        name: comp.name,
        avatar: comp.avatar,
        netWorth: Math.round(compNetWorth),
        propertyCount: compProps.length,
        color: comp.color,
        isPlayer: false
      };
    })
  ];

  // Sort by net worth descending
  leaderboard.sort((a, b) => b.netWorth - a.netWorth);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <Trophy size={20} style={{ color: '#eab308' }} />
        <h3 className="hud-font" style={{ margin: 0, fontSize: '16px', color: '#fff', textTransform: 'uppercase' }}>
          Empire Standings
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {leaderboard.map((entity, index) => {
          const rank = index + 1;
          return (
            <div 
              key={entity.id}
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid',
                borderColor: entity.isPlayer ? 'var(--cyber-green)' : 'var(--border-color)',
                background: entity.isPlayer ? 'rgba(57, 255, 20, 0.03)' : 'rgba(25, 27, 44, 0.2)',
                boxShadow: entity.isPlayer ? '0 0 15px rgba(57, 255, 20, 0.05)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Rank Badge */}
                <div className="hud-font" style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: rank === 1 ? '#eab308' : rank === 2 ? '#9ca3af' : rank === 3 ? '#b45309' : 'var(--bg-primary)',
                  color: rank <= 3 ? '#000' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '13px'
                }}>
                  {rank}
                </div>

                {/* Avatar & Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{entity.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {entity.name}
                      {entity.isPlayer && (
                        <span style={{ 
                          fontSize: '9px', 
                          background: 'var(--cyber-green)', 
                          color: '#000', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontWeight: 700,
                          letterSpacing: '0.5px'
                        }}>YOU</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Briefcase size={12} style={{ color: entity.color }} /> {entity.propertyCount} assets
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Worth Readout */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '2px' }}>NET WORTH</div>
                <div className="hud-font" style={{ 
                  fontSize: '16px', 
                  fontWeight: 900, 
                  color: entity.isPlayer ? 'var(--cyber-green)' : '#fff' 
                }}>
                  {formatCurrency(entity.netWorth)}
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};
