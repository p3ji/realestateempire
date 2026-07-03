import React, { useState, useEffect } from 'react';
import type { Property, Player, AICompetitor } from '../types';
import { formatCurrency, calculateMortgagePayment } from '../utils';
import { NEIGHBORHOODS } from '../constants';
import { X, Check, ArrowUpRight, Wrench, Percent, ShieldCheck } from 'lucide-react';

interface PropertyInspectorProps {
  property: Property;
  player: Player;
  competitors: AICompetitor[];
  allProperties: Property[];
  onClose: () => void;
  onPurchase: (propertyId: string, useMortgage: boolean, downPayment: number) => void;
  onSell: (propertyId: string) => void;
  onUpgrade: (propertyId: string, upgradeId: string) => void;
}

export const PropertyInspector: React.FC<PropertyInspectorProps> = ({
  property,
  player,
  competitors,
  allProperties,
  onClose,
  onPurchase,
  onSell,
  onUpgrade,
}) => {
  const isPlayerOwner = property.ownerId === 'player';
  const ownerComp = property.ownerId && property.ownerId !== 'player' 
    ? competitors.find(c => c.id === property.ownerId) 
    : undefined;
  
  // Mortgage buying config states
  const [useMortgage, setUseMortgage] = useState(true);
  
  // Calculate default minimum down payments (Residential 5%, Commercial 20%, Industrial 25%)
  const minDownPct = property.type === 'residential' ? 0.05 : property.type === 'commercial' ? 0.20 : 0.25;
  const minDownAmt = Math.round(property.marketValue * minDownPct);
  
  const [downPayment, setDownPayment] = useState(minDownAmt);

  // Update down payment if property changes
  useEffect(() => {
    const newMinPct = property.type === 'residential' ? 0.05 : property.type === 'commercial' ? 0.20 : 0.25;
    setDownPayment(Math.round(property.marketValue * newMinPct));
    setUseMortgage(true);
  }, [property.id]);

  // Mortgage Rate Calculation (based on credit score)
  const baseRate = 0.045; // 4.5%
  const ratePenalty = Math.max(0, (800 - player.creditScore) * 0.00005);
  const interestRate = baseRate + ratePenalty;
  
  // Est Mortgage payment
  const loanAmount = property.marketValue - downPayment;
  const estMortgagePayment = useMortgage ? calculateMortgagePayment(loanAmount, interestRate, 360) : 0;
  
  // Tax rate
  const neighborhoodObj = Object.values(NEIGHBORHOODS).find(n => n.name === property.neighborhood);
  const taxRate = neighborhoodObj ? neighborhoodObj.taxRate : 0.01;
  const estTaxMonthly = Math.round((property.marketValue * taxRate) / 12);
  
  // Maintenance cost monthly (matches game-loop formula)
  const conditionPenalty = (100 - property.condition) * 0.0004;
  const estMaintMonthly = Math.round((property.marketValue * (0.008 + conditionPenalty)) / 12);

  // Total cash flow simulation if player buys it
  const estNetIncome = Math.round(property.rent * property.occupancyRate) - 
    (useMortgage ? Math.round(estMortgagePayment) : 0) - 
    estTaxMonthly - 
    estMaintMonthly;

  const playerCanAfford = useMortgage 
    ? player.cash >= downPayment 
    : player.cash >= property.marketValue;

  // DTI (Debt-to-Income) check for mortgage approval:
  // Mortgage payment + other debts shouldn't exceed 45% of qualifying income.
  // Like real lenders, 80% of rental income counts (existing portfolio + this unit).
  const monthlySalary = player.salary / 12;
  const existingRentalIncome = allProperties
    .filter(p => p.ownerId === 'player')
    .reduce((sum, p) => sum + p.rent * p.occupancyRate, 0);
  const existingMortgagePayments = allProperties
    .filter(p => p.ownerId === 'player' && p.mortgage)
    .reduce((sum, p) => sum + (p.mortgage ? p.mortgage.monthlyPayment : 0), 0);
  const qualifyingIncome = monthlySalary +
    0.8 * (existingRentalIncome + property.rent * property.occupancyRate);
  const totalMonthlyDebtPayments =
    player.monthlyDebtPayment + existingMortgagePayments + estMortgagePayment;
  const dtiRatio = totalMonthlyDebtPayments / qualifyingIncome;
  const dtiApproved = !useMortgage || dtiRatio <= 0.45;

  const handlePurchase = () => {
    if (!playerCanAfford) return;
    if (useMortgage && !dtiApproved) return;
    onPurchase(property.id, useMortgage, downPayment);
  };

  return (
    <div style={{
      width: '380px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      flexShrink: 0,
      zIndex: 10,
      boxSizing: 'border-box'
    }}>
      {/* Inspector Header */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="cyber-header-glow hud-font" style={{
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--cyber-blue)',
            margin: 0,
            textTransform: 'uppercase'
          }}>
            Asset Inspector
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ID: {property.id.toUpperCase()}</span>
        </div>
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            borderRadius: '4px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Details Panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Core Profile */}
        <div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            {property.address}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>{property.neighborhood}</span>
            <span>&bull;</span>
            <span style={{ textTransform: 'uppercase', color: 'var(--cyber-blue)', fontWeight: 600 }}>{property.type}</span>
            {property.isReal && (
              <>
                <span>&bull;</span>
                <span title="This building exists — sourced from OpenStreetMap" style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--cyber-green)',
                  border: '1px solid rgba(57, 255, 20, 0.35)',
                  borderRadius: '4px',
                  padding: '1px 6px',
                  letterSpacing: '0.5px'
                }}>
                  REAL PARCEL
                </span>
              </>
            )}
          </div>
        </div>

        {/* Ownership Tag */}
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: isPlayerOwner 
            ? 'rgba(57, 255, 20, 0.08)' 
            : ownerComp 
              ? `${ownerComp.color}15`
              : 'rgba(255,255,255,0.03)',
          border: '1px solid',
          borderColor: isPlayerOwner 
            ? 'var(--cyber-green)' 
            : ownerComp 
              ? ownerComp.color 
              : 'var(--border-color)',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ color: 'var(--text-secondary)' }}>OWNERSHIP STATUS:</span>
          <span className="hud-font" style={{ 
            fontWeight: 700,
            color: isPlayerOwner 
              ? 'var(--cyber-green)' 
              : ownerComp 
                ? ownerComp.color 
                : 'var(--cyber-blue)'
          }}>
            {isPlayerOwner 
              ? 'PLAYER OWNED' 
              : ownerComp 
                ? ownerComp.name.toUpperCase() 
                : 'FOR SALE'}
          </span>
        </div>

        {/* Market Val & Rent Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>MARKET VALUE</div>
            <div className="hud-font" style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
              {formatCurrency(property.marketValue)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--cyber-green)', marginTop: '2px', display: 'flex', alignItems: 'center' }}>
              <ArrowUpRight size={10} /> +{(property.appreciationRate * 100).toFixed(1)}%/yr
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>EST. MONTHLY RENT</div>
            <div className="hud-font" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cyber-green)' }}>
              {formatCurrency(property.rent)}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Occupancy: {Math.round(property.occupancyRate * 100)}%
            </div>
          </div>
        </div>

        {/* Property Specs (Condition & Upgrades count) */}
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Structure Condition:</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{Math.round(property.condition)}/100</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${property.condition}%`, 
                height: '100%', 
                background: property.condition > 75 
                  ? 'var(--cyber-green)' 
                  : property.condition > 45 
                    ? 'var(--cyber-orange)' 
                    : 'var(--cyber-red)'
              }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Renovation Upgrades:</span>
            <span style={{ color: '#fff', fontWeight: 600 }}>
              {property.upgrades.filter(u => u.purchased).length} / {property.upgrades.length} Complete
            </span>
          </div>
        </div>

        {/* --- OPTION AREA 1: BUYING SYSTEM (UNOWNED) --- */}
        {!property.ownerId && (
          <div className="glass-panel" style={{ padding: '20px', border: '1px dashed rgba(0, 210, 255, 0.2)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 className="hud-font" style={{ margin: 0, fontSize: '13px', color: 'var(--cyber-blue)', textTransform: 'uppercase' }}>
              Purchase Options
            </h3>

            {/* Checkbox Mortgage */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', color: '#fff' }}>
              <input 
                type="checkbox" 
                checked={useMortgage}
                onChange={(e) => setUseMortgage(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--cyber-blue)' }}
              />
              Acquire via Commercial Mortgage
            </label>

            {useMortgage && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Down Payment:</span>
                  <span className="hud-font" style={{ color: 'var(--cyber-green)', fontWeight: 600 }}>
                    {formatCurrency(downPayment)} ({Math.round((downPayment / property.marketValue) * 100)}%)
                  </span>
                </div>
                <input 
                  type="range"
                  min={minDownAmt}
                  max={Math.min(property.marketValue * 0.9, player.cash)}
                  step={1000}
                  value={downPayment}
                  onChange={(e) => setDownPayment(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: 'var(--cyber-blue)' }}
                  disabled={player.cash < minDownAmt}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
                  <span>Min ({Math.round(minDownPct * 100)}%): {formatCurrency(minDownAmt)}</span>
                  <span>Max: {formatCurrency(Math.min(property.marketValue * 0.9, player.cash))}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Mortgage Principal:</span>
                    <span style={{ color: '#fff' }}>{formatCurrency(loanAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Interest Rate:</span>
                    <span className="hud-font" style={{ color: '#eab308' }}>{(interestRate * 100).toFixed(2)}% APR</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Est. Payment:</span>
                    <span style={{ color: 'var(--cyber-red)' }}>-{formatCurrency(estMortgagePayment)}/mo</span>
                  </div>
                </div>
              </div>
            )}

            {/* Estimated Cash Flow Simulator */}
            <div style={{ 
              background: 'var(--bg-primary)', 
              padding: '12px', 
              borderRadius: '6px', 
              fontSize: '11px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '4px' }}>
                <span style={{ color: '#fff' }}>Est. Monthly Cash Flow:</span>
                <span className="hud-font" style={{ color: estNetIncome >= 0 ? 'var(--cyber-green)' : 'var(--cyber-red)' }}>
                  {estNetIncome >= 0 ? '+' : ''}{formatCurrency(estNetIncome)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Rental Revenues:</span>
                <span style={{ color: 'var(--cyber-green)' }}>+{formatCurrency(property.rent * property.occupancyRate)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Property Tax:</span>
                <span>-{formatCurrency(estTaxMonthly)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Maintenance Budget:</span>
                <span>-{formatCurrency(estMaintMonthly)}</span>
              </div>
              {useMortgage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Mortgage P&I:</span>
                  <span>-{formatCurrency(estMortgagePayment)}</span>
                </div>
              )}
            </div>

            {/* Approval Warnings */}
            {!playerCanAfford && (
              <div style={{ color: 'var(--cyber-red)', fontSize: '11px', textAlign: 'center' }}>
                ⚠️ Insufficient cash reserves for this transaction.
              </div>
            )}
            {useMortgage && playerCanAfford && !dtiApproved && (
              <div style={{ color: 'var(--cyber-orange)', fontSize: '11px', textAlign: 'center', lineHeight: '1.3' }}>
                ⚠️ Mortgage Denied: Debt-To-Income (DTI) ratio exceeds 45%. Pay down student debts or increase salaries to qualify.
              </div>
            )}

            {/* Buy button */}
            <button
              onClick={handlePurchase}
              disabled={!playerCanAfford || (useMortgage && !dtiApproved)}
              className="btn-neon-filled"
              style={{
                '--neon-color': 'var(--cyber-green)',
                '--neon-color-glow': 'var(--cyber-green-glow)',
                width: '100%',
                marginTop: '4px'
              } as React.CSSProperties}
            >
              Acquire Property
            </button>
          </div>
        )}

        {/* --- OPTION AREA 2: PLAYER MANAGEMENT (OWNED BY PLAYER) --- */}
        {isPlayerOwner && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Active Mortgage status */}
            {property.mortgage && (
              <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(234, 179, 8, 0.2)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: 'var(--cyber-orange)', fontWeight: 600 }}>
                  <Percent size={14} /> ACTIVE MORTGAGE DEBT
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Remaining Principal Balance:</span>
                    <span className="hud-font" style={{ color: '#fff' }}>{formatCurrency(property.mortgage.remainingBalance)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Monthly Amortized Payment:</span>
                    <span style={{ color: 'var(--cyber-red)' }}>-{formatCurrency(property.mortgage.monthlyPayment)}/mo</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Interest rate / Terms:</span>
                    <span>{(property.mortgage.interestRate * 100).toFixed(2)}% APR &bull; 30-Yr</span>
                  </div>
                </div>
              </div>
            )}

            {/* Renovation Center */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 className="hud-font" style={{ margin: 0, fontSize: '13px', color: 'var(--cyber-blue)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wrench size={14} /> Renovation Control
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {property.upgrades.map(upgrade => {
                  const canAfford = player.cash >= upgrade.cost;
                  return (
                    <div 
                      key={upgrade.id}
                      className="glass-panel"
                      style={{ 
                        padding: '12px 14px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        background: upgrade.purchased ? 'rgba(57, 255, 20, 0.02)' : 'rgba(25, 27, 44, 0.2)',
                        borderColor: upgrade.purchased ? 'rgba(57, 255, 20, 0.15)' : 'var(--border-color)'
                      }}
                    >
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {upgrade.name}
                          {upgrade.purchased && <Check size={14} style={{ color: 'var(--cyber-green)' }} />}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '2px 0 6px' }}>
                          {upgrade.description}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
                          <span style={{ color: 'var(--cyber-green)' }}>Rent: +{Math.round((upgrade.rentModifier - 1) * 100)}%</span>
                          <span style={{ color: 'var(--cyber-blue)' }}>Asset Val: +{Math.round((upgrade.valueModifier - 1) * 100)}%</span>
                        </div>
                      </div>

                      <div>
                        {upgrade.purchased ? (
                          <span className="hud-font" style={{ fontSize: '10px', color: 'var(--cyber-green)', fontWeight: 600 }}>INSTALLED</span>
                        ) : (
                          <button
                            onClick={() => onUpgrade(property.id, upgrade.id)}
                            disabled={!canAfford}
                            className="btn-neon"
                            style={{ 
                              '--neon-color': 'var(--cyber-blue)',
                              fontSize: '10px',
                              padding: '5px 10px',
                              whiteSpace: 'nowrap'
                            } as React.CSSProperties}
                          >
                            {formatCurrency(upgrade.cost)}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Liquidation / Sell section */}
            <div style={{ 
              borderTop: '1px solid var(--border-color)', 
              paddingTop: '20px', 
              marginTop: '10px',
              display: 'flex', 
              flexDirection: 'column', 
              gap: '10px' 
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Liquidating this asset will pay off any outstanding mortgage principal and deposit the remaining equity ({formatCurrency(property.marketValue - (property.mortgage ? property.mortgage.remainingBalance : 0))}) directly into your cash reserves.
              </div>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to sell ${property.address} for ${formatCurrency(property.marketValue)}?`)) {
                    onSell(property.id);
                  }
                }}
                className="btn-neon-filled"
                style={{
                  '--neon-color': 'var(--cyber-red)',
                  '--neon-color-glow': 'var(--cyber-red-glow)',
                  width: '100%',
                } as React.CSSProperties}
              >
                Liquidate Asset (Sell)
              </button>
            </div>
          </div>
        )}

        {/* --- OPTION AREA 3: OWNED BY COMPETITOR --- */}
        {ownerComp && (
          <div className="glass-panel" style={{ padding: '20px', border: `1px solid ${ownerComp.color}33`, background: `${ownerComp.color}05`, display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center' }}>
            <span style={{ fontSize: '40px' }}>{ownerComp.avatar}</span>
            <h4 style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#fff' }}>{ownerComp.name}</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              This asset is part of the investment portfolio of {ownerComp.name}. It is currently generating rental cash flow and is not available for purchase.
            </p>
            <div style={{ 
              marginTop: '10px', 
              fontSize: '11px', 
              color: ownerComp.color, 
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <ShieldCheck size={14} /> Portfolio Protected
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
