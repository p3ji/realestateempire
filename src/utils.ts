import type { Property, PropertyType, Mortgage, PropertyUpgrade } from './types';
import { NEIGHBORHOODS, UPGRADES_TEMPLATES } from './constants';

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const calculateMortgagePayment = (
  principal: number,
  annualRate: number,
  termMonths: number
): number => {
  if (annualRate === 0) return principal / termMonths;
  const monthlyRate = annualRate / 12;
  const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
  return isNaN(payment) ? 0 : payment;
};

export const createMortgage = (
  principal: number,
  interestRate: number,
  termMonths: number = 360
): Mortgage => {
  const monthlyPayment = calculateMortgagePayment(principal, interestRate, termMonths);
  return {
    principal,
    remainingBalance: principal,
    monthlyPayment,
    interestRate,
    termMonths,
    paymentsMade: 0,
  };
};

// Generates a mock address in Ottawa
const generateRandomAddress = (neighborhoodKey: string, index: number): string => {
  const n = NEIGHBORHOODS[neighborhoodKey];
  const street = n.streets[index % n.streets.length];
  const number = Math.floor(100 + (index * 47) % 899);
  return `${number} ${street}`;
};

// Generate initial properties for Ottawa
export const generateProperties = (): Property[] => {
  const properties: Property[] = [];
  let idCounter = 1;

  Object.entries(NEIGHBORHOODS).forEach(([key, n]) => {
    // Generate ~8 properties per neighborhood
    const numProperties = 8;
    
    for (let i = 0; i < numProperties; i++) {
      const id = `prop_${key}_${i + 1}`;
      const address = generateRandomAddress(key, i);
      
      // Distribute coordinates uniformly inside neighborhood bounding boxes
      const latRange = n.latRange[1] - n.latRange[0];
      const lngRange = n.lngRange[1] - n.lngRange[0];
      // Deterministic placement using pseudo-random offset
      const latOffset = ((i * 17) % 100) / 100;
      const lngOffset = ((i * 23) % 100) / 100;
      const lat = n.latRange[0] + latOffset * latRange;
      const lng = n.lngRange[0] + lngOffset * lngRange;

      // Property type distribution (mostly residential, some commercial, rare industrial)
      let type: PropertyType = 'residential';
      if (i === 4 || i === 5) type = 'commercial';
      if (i === 7 && (key === 'kanata' || key === 'orleans')) type = 'industrial';

      // Price scales based on neighborhood averages and type modifiers
      let priceModifier = 0.8 + ((i * 3) % 5) * 0.1; // 0.8 to 1.2
      if (type === 'commercial') priceModifier *= 2.2;
      if (type === 'industrial') priceModifier *= 3.0;

      const basePrice = Math.round((n.medianPrice * priceModifier) / 1000) * 1000;
      
      // Rent rates are around 0.5% of price for residential, 0.7% for commercial, 0.8% for industrial monthly
      let rentYieldFactor = 0.005;
      if (type === 'commercial') rentYieldFactor = 0.0065;
      if (type === 'industrial') rentYieldFactor = 0.0075;
      
      const baseRent = Math.round((basePrice * rentYieldFactor * (0.9 + ((i * 7) % 3) * 0.1)) / 50) * 50;

      // Make one duplex in Sandy Hill the starting property for the Heir archetype
      const isHeirStartingProperty = (key === 'sandyhill' && i === 0);
      const ownerId = isHeirStartingProperty ? 'heir_starting_placeholder' : null;
      const ownerName = isHeirStartingProperty ? 'Player' : null;

      // Fresh upgrades list
      const upgrades: PropertyUpgrade[] = UPGRADES_TEMPLATES.map(u => ({
        ...u,
        purchased: false,
      }));

      properties.push({
        id,
        address,
        lat,
        lng,
        neighborhood: n.name,
        type,
        price: basePrice,
        marketValue: basePrice,
        rent: baseRent,
        basePrice,
        baseRent,
        occupancyRate: 0.9 + (i % 3) * 0.05, // 0.9 to 1.0 initial occupancy
        condition: isHeirStartingProperty ? 40 : 80 + (i % 5) * 4, // Heir property is run-down
        ownerId,
        ownerName,
        upgrades,
        mortgage: null,
        appreciationRate: n.appreciationRate + (i % 3 - 1) * 0.005,
      });

      idCounter++;
    }
  });

  return properties;
};

// Date math helper (starting July 2, 2026)
export const getGameDateString = (daysElapsed: number): string => {
  const startDate = new Date('2026-07-02');
  startDate.setDate(startDate.getDate() + daysElapsed);
  
  const yyyy = startDate.getFullYear();
  const mm = String(startDate.getMonth() + 1).padStart(2, '0');
  const dd = String(startDate.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
};

export const getMonthName = (dateStr: string): string => {
  const parts = dateStr.split('-');
  const monthIdx = parseInt(parts[1], 10) - 1;
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  return `${months[monthIdx]} ${parts[0]}`;
};
