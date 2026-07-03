export type PropertyType = 'residential' | 'commercial' | 'industrial';

export interface Mortgage {
  principal: number;
  remainingBalance: number;
  monthlyPayment: number;
  interestRate: number; // e.g., 0.05 for 5%
  termMonths: number; // e.g., 360 for 30 years
  paymentsMade: number;
}

export interface PropertyUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  rentModifier: number; // e.g., 1.15 for 15% increase
  valueModifier: number; // e.g., 1.10 for 10% increase
  purchased: boolean;
}

export interface Property {
  id: string;
  address: string;
  lat: number;
  lng: number;
  neighborhood: string;
  type: PropertyType;
  price: number;
  marketValue: number;
  rent: number;
  basePrice: number;
  baseRent: number;
  occupancyRate: number; // 0 to 1
  condition: number; // 0 to 100
  ownerId: string | null; // null means for sale by city
  ownerName: string | null; // e.g. 'Player' or AI name
  upgrades: PropertyUpgrade[];
  mortgage: Mortgage | null;
  appreciationRate: number; // yearly e.g. 0.04
  sprite?: string; // building art token, e.g. 'single_family'
  isReal?: boolean; // true when sourced from a real OpenStreetMap building
}

export interface Player {
  name: string;
  archetype: string;
  cash: number;
  salary: number;
  debt: number; // Non-mortgage debt (student loans)
  monthlyDebtPayment: number;
  creditScore: number;
  portfolio: string[]; // Property IDs
  netWorthHistory: { date: string; value: number }[];
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // positive for income, negative for expense
  category: 'rent' | 'salary' | 'mortgage' | 'renovation' | 'tax' | 'purchase' | 'sale' | 'other';
}

export interface AICompetitor {
  id: string;
  name: string;
  avatar: string;
  cash: number;
  portfolio: string[]; // Property IDs
  color: string; // Color code for UI and map glow
  aggression: number; // 0 to 1, dictates buying frequency
}

export interface GameState {
  player: Player;
  properties: Property[];
  competitors: AICompetitor[];
  transactions: Transaction[];
  gameDate: string; // YYYY-MM-DD
  gameTicks: number; // Number of elapsed ticks
  selectedPropertyId: string | null;
  speed: number; // 0 (paused), 1 (normal: 1 day = 12s), 2 (fast: 1 day = 3s)
}
