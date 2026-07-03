import type { Property, PropertyType, Mortgage, PropertyUpgrade } from './types';
import { NEIGHBORHOODS, UPGRADES_TEMPLATES } from './constants';
import type { OsmListings, OsmBuilding } from './osm';

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

// Relative price weight of each building sprite vs the neighborhood's median home
const SPRITE_PRICE_MULTIPLIERS: Record<string, number> = {
  single_family: 1.0,
  row_house: 0.8,
  apartment: 1.9,
  condo_tower: 3.6,
  student_dorm: 2.2,
  strip_mall: 2.2,
  office_tower: 3.2,
  skyscraper_cluster: 5.2,
  historic_hotel: 3.8,
  mega_mall: 5.0,
  supermarket: 2.6,
  parking_garage: 1.6,
  warehouse: 2.8,
  data_center: 4.2,
  brewery: 2.4,
  self_storage: 2.2,
};

const RENT_YIELD_BY_TYPE: Record<PropertyType, number> = {
  residential: 0.005,
  commercial: 0.0065,
  industrial: 0.0075,
};

// Build a game property from a real OpenStreetMap building
const buildFromOsm = (
  key: string,
  bld: OsmBuilding,
  index: number,
  isHeirStartingProperty: boolean
): Property => {
  const n = NEIGHBORHOODS[key];
  const seed = bld.osmId % 1000;

  let multiplier = SPRITE_PRICE_MULTIPLIERS[bld.sprite] ?? 1.0;
  // Taller buildings are worth more (capped so prices stay playable)
  if (bld.levels > 2) {
    multiplier *= Math.min(1.6, 1 + (bld.levels - 2) * 0.06);
  }
  const variance = 0.85 + (seed % 30) / 100; // deterministic 0.85 - 1.14

  const basePrice = Math.round((n.medianPrice * multiplier * variance) / 1000) * 1000;
  const rentYield = RENT_YIELD_BY_TYPE[bld.gameType];
  const baseRent = Math.round((basePrice * rentYield * (0.9 + (seed % 3) * 0.1)) / 50) * 50;

  const upgrades: PropertyUpgrade[] = UPGRADES_TEMPLATES.map(u => ({ ...u, purchased: false }));

  return {
    id: `prop_${key}_${index + 1}`,
    address: bld.name ? `${bld.address} (${bld.name})` : bld.address,
    lat: bld.lat,
    lng: bld.lng,
    neighborhood: n.name,
    type: bld.gameType,
    price: basePrice,
    marketValue: basePrice,
    rent: baseRent,
    basePrice,
    baseRent,
    occupancyRate: 0.85 + (seed % 4) * 0.05, // 0.85 - 1.0
    condition: isHeirStartingProperty ? 40 : 70 + (seed % 6) * 5, // 70 - 95
    ownerId: null,
    ownerName: null,
    upgrades,
    mortgage: null,
    appreciationRate: n.appreciationRate + ((seed % 3) - 1) * 0.005,
    sprite: bld.sprite,
    isReal: true,
  };
};

// Generate initial properties for Ottawa. When real OpenStreetMap listings are
// provided, neighborhoods with enough real buildings use those; any neighborhood
// with too few falls back to synthetic listings.
export const generateProperties = (listings?: OsmListings | null): Property[] => {
  const properties: Property[] = [];

  Object.entries(NEIGHBORHOODS).forEach(([key, n]) => {
    const osmBuildings = listings?.[key] ?? [];
    if (osmBuildings.length >= 5) {
      // Put a residential building first so the Heir's fixer-upper
      // (prop_sandyhill_1) is always a home, not a mall
      const sorted = [...osmBuildings].sort((a, b) =>
        (a.gameType === 'residential' ? 0 : 1) - (b.gameType === 'residential' ? 0 : 1)
      );
      sorted.forEach((bld, i) => {
        const isHeirStart = key === 'sandyhill' && i === 0;
        properties.push(buildFromOsm(key, bld, i, isHeirStart));
      });
      return;
    }

    // Synthetic fallback: ~8 procedural properties for this neighborhood
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

      // The first Sandy Hill duplex is a run-down fixer-upper; the Heir archetype
      // starts owning it (assigned in startNewGame), otherwise it's for sale like any other
      const isHeirStartingProperty = (key === 'sandyhill' && i === 0);
      const ownerId = null;
      const ownerName = null;

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
    }
  });

  return properties;
};

// Date math helper (starting July 2, 2026)
export const getGameDateString = (daysElapsed: number): string => {
  const startDate = new Date(2026, 6, 2); // local time to avoid UTC off-by-one
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
