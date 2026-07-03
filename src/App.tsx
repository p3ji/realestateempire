import React, { useState } from 'react';
import { useGameState } from './useGameState';
import { CharacterSelect } from './components/CharacterSelect';
import { Sidebar } from './components/Sidebar';
import { Map } from './components/Map';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { PropertyInspector } from './components/PropertyInspector';
import { Leaderboard } from './components/Leaderboard';
import { TransactionLog } from './components/TransactionLog';

export const App: React.FC = () => {
  const {
    gameState,
    startNewGame,
    resetGame,
    selectProperty,
    setSpeed,
    purchaseProperty,
    sellProperty,
    buyUpgrade,
  } = useGameState();

  // Active secondary panel overlay on the right ('leaderboard' | 'transactions' | null)
  const [activePanel, setActivePanel] = useState<'leaderboard' | 'transactions' | null>(null);

  // If game state hasn't been initialized (or has been reset), show Character Select
  if (gameState === null) {
    return <CharacterSelect onSelect={startNewGame} />;
  }

  const selectedProperty = gameState.properties.find(p => p.id === gameState.selectedPropertyId);

  // Determine what is currently active in the right sidebar panel
  // PropertyInspector takes priority over other stats panels
  const showRightPanel = !!selectedProperty || !!activePanel;

  const handleOpenPanel = (panel: 'transactions' | 'leaderboard' | null) => {
    // If opening a status panel, clear the active property selection first
    if (panel !== null) {
      selectProperty(null);
    }
    setActivePanel(panel);
  };

  const handleSelectProperty = (id: string | null) => {
    selectProperty(id);
    if (id !== null) {
      // Close stats panels if a property is selected
      setActivePanel(null);
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      background: 'var(--bg-primary)',
      position: 'relative'
    }}>
      {/* Left Empire Command Sidebar */}
      <Sidebar
        state={gameState}
        onSelectProperty={handleSelectProperty}
        onSetSpeed={setSpeed}
        onReset={resetGame}
        onOpenPanel={handleOpenPanel}
        activePanel={activePanel}
      />

      {/* Center Interactive Satellite Map */}
      <div style={{
        flex: 1,
        height: '100%',
        position: 'relative',
        zIndex: 1
      }}>
        <MapErrorBoundary>
          <Map
            properties={gameState.properties}
            competitors={gameState.competitors}
            selectedPropertyId={gameState.selectedPropertyId}
            onSelectProperty={handleSelectProperty}
          />
        </MapErrorBoundary>
      </div>

      {/* Right Dynamic HUD Slide-out Sidebar Panel */}
      <div style={{
        width: showRightPanel ? '380px' : '0px',
        opacity: showRightPanel ? 1 : 0,
        height: '100%',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        background: 'var(--bg-secondary)',
      }}>
        {showRightPanel && (
          <div style={{ width: '380px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {selectedProperty ? (
              <PropertyInspector
                property={selectedProperty}
                player={gameState.player}
                competitors={gameState.competitors}
                allProperties={gameState.properties}
                onClose={() => selectProperty(null)}
                onPurchase={purchaseProperty}
                onSell={sellProperty}
                onUpgrade={buyUpgrade}
              />
            ) : activePanel === 'leaderboard' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                  <button 
                    onClick={() => setActivePanel(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    CLOSE [X]
                  </button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  <Leaderboard state={gameState} />
                </div>
              </div>
            ) : activePanel === 'transactions' ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                  <button 
                    onClick={() => setActivePanel(null)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    CLOSE [X]
                  </button>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <TransactionLog transactions={gameState.transactions} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
