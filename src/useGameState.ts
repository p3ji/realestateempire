import { useState, useEffect } from 'react';
import type { Player, Transaction, AICompetitor, GameState, Mortgage } from './types';
import { ARCHETYPES, AI_COMPETITORS_TEMPLATES, NEIGHBORHOODS } from './constants';
import { generateProperties, getGameDateString, createMortgage } from './utils';
import { fetchRealListings } from './osm';
import confetti from 'canvas-confetti';

const LOCAL_STORAGE_KEY = 'real_estate_empire_save_v1';

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);

  // Load game on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as GameState;
        setGameState(parsed);
        return;
      } catch (e) {
        console.error('Failed to load saved state, starting fresh', e);
      }
    }
    // Set to null so App.tsx knows to show CharacterSelect,
    // and prefetch real OSM listings while the player picks a backstory
    setGameState(null);
    fetchRealListings();
  }, []);

  // Persist after every committed state change (keeps updaters pure)
  useEffect(() => {
    if (gameState) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  // Start new game
  const startNewGame = async (playerName: string, archetypeKey: string) => {
    const template = ARCHETYPES[archetypeKey];

    // Real OpenStreetMap listings when reachable (usually already prefetched);
    // generateProperties falls back to synthetic listings when null
    const listings = await fetchRealListings();

    // Create player profile
    const player: Player = {
      name: playerName || template.name,
      archetype: template.archetype,
      cash: template.cash,
      salary: template.salary,
      debt: template.debt,
      monthlyDebtPayment: template.monthlyDebtPayment,
      creditScore: template.creditScore,
      portfolio: [],
      netWorthHistory: [{ date: '2026-07-02', value: template.cash - template.debt }],
    };

    // Generate property list
    const properties = generateProperties(listings);

    // If starting as the Heir, give them ownership of the run-down Sandy Hill property
    if (archetypeKey === 'heir') {
      const startingProp = properties.find(p => p.id === 'prop_sandyhill_1');
      if (startingProp) {
        startingProp.ownerId = 'player';
        startingProp.ownerName = player.name;
        player.portfolio.push(startingProp.id);
        
        // Recalculate first net worth point
        player.netWorthHistory = [{ 
          date: '2026-07-02', 
          value: player.cash + startingProp.marketValue - player.debt 
        }];
      }
    }

    // Set up competitors
    const competitors: AICompetitor[] = AI_COMPETITORS_TEMPLATES.map(comp => {
      // Find a random available property to start with
      const available = properties.filter(p => p.ownerId === null && p.type === 'residential');
      const startProp = available[Math.floor(Math.random() * available.length)];
      
      const compPortfolio: string[] = [];
      if (startProp) {
        startProp.ownerId = comp.id;
        startProp.ownerName = comp.name;
        compPortfolio.push(startProp.id);
      }

      return {
        ...comp,
        portfolio: compPortfolio,
      };
    });

    const initialTransactions: Transaction[] = [
      {
        id: 'tx_start',
        date: '2026-07-02',
        description: `Started real estate career as a ${player.archetype}`,
        amount: player.cash,
        category: 'other',
      }
    ];

    const newGameState: GameState = {
      player,
      properties,
      competitors,
      transactions: initialTransactions,
      gameDate: '2026-07-02',
      gameTicks: 0,
      selectedPropertyId: null,
      speed: 1,
    };

    setGameState(newGameState);
  };

  // Reset Game
  const resetGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setGameState(null);
  };

  // Select Property
  const selectProperty = (id: string | null) => {
    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, selectedPropertyId: id };
    });
  };

  // Change game speed
  const setSpeed = (speed: number) => {
    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, speed };
    });
  };

  // Buying Flow (Cash or Mortgage)
  const purchaseProperty = (propertyId: string, useMortgage: boolean, downPayment: number) => {
    setGameState(prev => {
      if (!prev) return null;
      const property = prev.properties.find(p => p.id === propertyId);
      if (!property || property.ownerId !== null) return prev;

      const upfrontCost = useMortgage ? downPayment : property.marketValue;
      if (prev.player.cash < upfrontCost) return prev;

      const player = { ...prev.player };
      const properties = prev.properties.map(p => {
        if (p.id !== propertyId) return p;
        
        let mortgage: Mortgage | null = null;
        if (useMortgage) {
          const loanAmt = property.marketValue - downPayment;
          // Calculate rate based on credit score (higher score = lower rate)
          const baseRate = 0.045; // 4.5%
          const ratePenalty = Math.max(0, (800 - player.creditScore) * 0.00005);
          const rate = baseRate + ratePenalty;
          mortgage = createMortgage(loanAmt, rate);
        }

        return {
          ...p,
          ownerId: 'player',
          ownerName: player.name,
          mortgage,
        };
      });

      const cost = useMortgage ? downPayment : property.marketValue;
      player.cash -= cost;
      player.portfolio = [...player.portfolio, propertyId];

      const tx: Transaction = {
        id: `tx_buy_${propertyId}`,
        date: prev.gameDate,
        description: `Purchased ${property.address} (${useMortgage ? 'Mortgaged' : 'Cash'})`,
        amount: -cost,
        category: 'purchase',
      };

      return {
        ...prev,
        player,
        properties,
        transactions: [tx, ...prev.transactions],
      };
    });

    // Celebration side effect stays outside the state updater
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });
  };

  // Selling Flow
  const sellProperty = (propertyId: string) => {
    setGameState(prev => {
      if (!prev) return null;
      const property = prev.properties.find(p => p.id === propertyId);
      if (!property || property.ownerId !== 'player') return prev;

      const player = { ...prev.player };
      const properties = prev.properties.map(p => {
        if (p.id !== propertyId) return p;
        return {
          ...p,
          ownerId: null,
          ownerName: null,
          mortgage: null,
        };
      });

      // Payout = Value - Remaining Loan Balance
      const loanBalance = property.mortgage ? property.mortgage.remainingBalance : 0;
      const cashReceived = property.marketValue - loanBalance;
      player.cash += cashReceived;
      player.portfolio = player.portfolio.filter(id => id !== propertyId);

      const tx: Transaction = {
        id: `tx_sell_${propertyId}_${prev.gameTicks}`,
        date: prev.gameDate,
        description: `Sold ${property.address} for ${Math.round(property.marketValue)} (Paid off ${Math.round(loanBalance)} loan)`,
        amount: cashReceived,
        category: 'sale',
      };

      return {
        ...prev,
        player,
        properties,
        transactions: [tx, ...prev.transactions],
      };
    });
  };

  // Renovate / Upgrade property
  const buyUpgrade = (propertyId: string, upgradeId: string) => {
    setGameState(prev => {
      if (!prev) return null;
      const property = prev.properties.find(p => p.id === propertyId);
      if (!property || property.ownerId !== 'player') return prev;

      const upgradeTemplate = property.upgrades.find(u => u.id === upgradeId);
      if (!upgradeTemplate || upgradeTemplate.purchased || prev.player.cash < upgradeTemplate.cost) return prev;

      const player = { ...prev.player };
      player.cash -= upgradeTemplate.cost;

      const properties = prev.properties.map(p => {
        if (p.id !== propertyId) return p;
        
        const upgrades = p.upgrades.map(u => {
          if (u.id !== upgradeId) return u;
          return { ...u, purchased: true };
        });

        // Calculate new market value and rent based on upgrade benefits
        const updatedVal = Math.round(p.marketValue * upgradeTemplate.valueModifier);
        const updatedRent = Math.round(p.rent * upgradeTemplate.rentModifier);
        const updatedCondition = Math.min(100, p.condition + 15);

        return {
          ...p,
          upgrades,
          marketValue: updatedVal,
          rent: updatedRent,
          condition: updatedCondition,
        };
      });

      const tx: Transaction = {
        id: `tx_upgrade_${propertyId}_${upgradeId}`,
        date: prev.gameDate,
        description: `Upgraded ${property.address} with ${upgradeTemplate.name}`,
        amount: -upgradeTemplate.cost,
        category: 'renovation',
      };

      return {
        ...prev,
        player,
        properties,
        transactions: [tx, ...prev.transactions],
      };
    });
  };

  // Game Loop Ticker
  useEffect(() => {
    let intervalId: any = null;

    // Pure state transition: safe under StrictMode double-invoke and
    // never overwrites interleaved player actions (functional update)
    const computeTick = (current: GameState): GameState => {

      const nextTicks = current.gameTicks + 1;
      const nextDate = getGameDateString(nextTicks);
      const isMonthEnd = nextTicks % 30 === 0;

      // 1. Daily Market Price Fluctuations & AI purchases
      let properties = current.properties.map(p => {
        // Daily appreciation (appreciation rate divided by 365)
        const dailyAppreciation = p.appreciationRate / 365;
        // Small random daily noise (-0.05% to +0.07%)
        const dailyNoise = -0.0005 + Math.random() * 0.0012;
        
        // Decay property condition slowly over time if not renovated (1% per game month)
        const newCondition = Math.max(20, p.condition - (1 / 30));

        // Condition affects market value (bad condition drops value up to 20%),
        // applied as a ratio of today's vs yesterday's modifier so it never compounds
        const prevConditionModifier = 0.8 + (p.condition / 100) * 0.2;
        const conditionModifier = 0.8 + (newCondition / 100) * 0.2;
        const currentMarketValue = p.marketValue *
          (1 + dailyAppreciation + dailyNoise) *
          (conditionModifier / prevConditionModifier);

        return {
          ...p,
          marketValue: Math.round(currentMarketValue),
          condition: newCondition,
        };
      });

      const player = { ...current.player };
      const competitors = current.competitors.map(c => ({ ...c, portfolio: [...c.portfolio] }));
      const newTransactions = [...current.transactions];

      // 2. AI Purchase Action (Daily 1% chance per competitor based on aggression)
      competitors.forEach(comp => {
        const purchaseRoll = Math.random();
        if (purchaseRoll < 0.008 * comp.aggression) {
          // AI wants to buy property
          const available = properties.filter(p => p.ownerId === null);
          if (available.length > 0) {
            // Filter ones they can afford with cash or with simulated leverage
            const buyable = available.filter(p => p.marketValue <= comp.cash * 4);
            if (buyable.length > 0) {
              const target = buyable[Math.floor(Math.random() * buyable.length)];
              
              // Proceed purchase
              properties = properties.map(p => {
                if (p.id !== target.id) return p;
                return {
                  ...p,
                  ownerId: comp.id,
                  ownerName: comp.name,
                };
              });

              // Subtract price from AI cash (simulate 25% down payment)
              const downPmt = target.marketValue * 0.25;
              comp.cash -= downPmt;
              comp.portfolio.push(target.id);

              const tx: Transaction = {
                id: `tx_comp_${Date.now()}_${comp.id}`,
                date: nextDate,
                description: `${comp.name} acquired ${target.address} in ${target.neighborhood}`,
                amount: -target.marketValue,
                category: 'purchase',
              };
              newTransactions.unshift(tx);
            }
          }
        }
      });

      // 3. Monthly Financial Billing cycle (Every 30 ticks)
      if (isMonthEnd) {
        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        
        // --- PLAYER CASH FLOW ---
        // A. Salary
        const salaryIncome = Math.round(player.salary / 12);
        monthlyIncome += salaryIncome;
        newTransactions.unshift({
          id: `tx_salary_${nextTicks}`,
          date: nextDate,
          description: `Monthly Salary Payment (${player.archetype})`,
          amount: salaryIncome,
          category: 'salary',
        });

        // B. Personal Debts (student loans)
        if (player.debt > 0) {
          const debtPmt = Math.min(player.debt, player.monthlyDebtPayment);
          player.debt -= debtPmt;
          monthlyExpenses += debtPmt;
          newTransactions.unshift({
            id: `tx_debt_${nextTicks}`,
            date: nextDate,
            description: `Student Loan Monthly Repayment`,
            amount: -debtPmt,
            category: 'mortgage',
          });
        }

        // C. Properties Rental Income, Taxes, Mortgages, Maintenance
        properties = properties.map(p => {
          if (p.ownerId !== 'player') return p;

          // Rental income
          const rentCollected = Math.round(p.rent * p.occupancyRate);
          monthlyIncome += rentCollected;
          newTransactions.unshift({
            id: `tx_rent_${p.id}_${nextTicks}`,
            date: nextDate,
            description: `Rental income from ${p.address}`,
            amount: rentCollected,
            category: 'rent',
          });

          // Property taxes (yearly taxRate divided by 12)
          const propTax = Math.round((p.marketValue * NEIGHBORHOODS[p.id.split('_')[1]].taxRate) / 12);
          monthlyExpenses += propTax;
          newTransactions.unshift({
            id: `tx_tax_${p.id}_${nextTicks}`,
            date: nextDate,
            description: `Property tax for ${p.address}`,
            amount: -propTax,
            category: 'tax',
          });

          // Maintenance (approx 0.8% of market value yearly, adjusted by property condition;
          // worst condition adds up to ~3.2% yearly)
          const conditionPenalty = (100 - p.condition) * 0.0004; // poor condition = high maintenance
          const maintCost = Math.round((p.marketValue * (0.008 + conditionPenalty)) / 12);
          monthlyExpenses += maintCost;
          newTransactions.unshift({
            id: `tx_maint_${p.id}_${nextTicks}`,
            date: nextDate,
            description: `Maintenance expenses for ${p.address}`,
            amount: -maintCost,
            category: 'other',
          });

          // Mortgage payment
          let updatedMortgage = p.mortgage;
          if (p.mortgage) {
            const m = p.mortgage;
            const interestPayment = m.remainingBalance * (m.interestRate / 12);
            const principalPayment = Math.min(m.remainingBalance, m.monthlyPayment - interestPayment);
            
            const totalPayment = interestPayment + principalPayment;
            monthlyExpenses += totalPayment;

            newTransactions.unshift({
              id: `tx_mortgage_${p.id}_${nextTicks}`,
              date: nextDate,
              description: `Mortgage payment for ${p.address} (Interest: ${Math.round(interestPayment)}, Principal: ${Math.round(principalPayment)})`,
              amount: -totalPayment,
              category: 'mortgage',
            });

            const nextBalance = Math.max(0, m.remainingBalance - principalPayment);
            updatedMortgage = {
              ...m,
              remainingBalance: nextBalance,
              paymentsMade: m.paymentsMade + 1,
            };

            // Paid off mortgage check!
            if (nextBalance <= 0) {
              updatedMortgage = null;
              newTransactions.unshift({
                id: `tx_paidoff_${p.id}_${nextTicks}`,
                date: nextDate,
                description: `CONGRATULATIONS! Mortgage fully paid off for ${p.address}!`,
                amount: 0,
                category: 'other',
              });
            }
          }

          return {
            ...p,
            mortgage: updatedMortgage,
          };
        });

        player.cash += (monthlyIncome - monthlyExpenses);

        // --- AI MONTHLY CASH FLOW ---
        competitors.forEach(comp => {
          let compIncome = 5000 * comp.aggression; // Base non-real-estate income
          properties.forEach(p => {
            if (p.ownerId === comp.id) {
              compIncome += p.rent * 0.8; // rent minus tax/maintenance simulator
            }
          });
          comp.cash += compIncome;
        });

        // --- NET WORTH HISTORY RECORD ---
        let totalEquity = player.cash;
        properties.forEach(p => {
          if (p.ownerId === 'player') {
            const loan = p.mortgage ? p.mortgage.remainingBalance : 0;
            totalEquity += (p.marketValue - loan);
          }
        });
        totalEquity -= player.debt;

        // Immutable append, capped at last 24 points to avoid massive saves
        player.netWorthHistory = [
          ...player.netWorthHistory,
          { date: nextDate, value: totalEquity },
        ].slice(-24);
      }

      return {
        ...current,
        properties,
        player,
        competitors,
        transactions: newTransactions.slice(0, 150), // Cap at 150 log entries
        gameTicks: nextTicks,
        gameDate: nextDate,
      };
    };

    const runTick = () => {
      setGameState(prev => {
        if (!prev || prev.speed === 0) return prev;
        return computeTick(prev);
      });
    };

    // Game speed tickers
    // Speed 1: 1 tick = 1.5 seconds (Fast but manageable)
    // Speed 2: 1 tick = 0.35 seconds (Rapid acceleration)
    // Speed 0: Paused
    const speedIntervals = [0, 1500, 350];
    const activeInterval = gameState ? speedIntervals[gameState.speed] : 0;

    if (activeInterval > 0) {
      intervalId = setInterval(runTick, activeInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [gameState?.speed, gameState === null]);

  return {
    gameState,
    startNewGame,
    resetGame,
    selectProperty,
    setSpeed,
    purchaseProperty,
    sellProperty,
    buyUpgrade,
  };
};
