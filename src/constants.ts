import type { Player, PropertyUpgrade, AICompetitor } from './types';

export const NEIGHBORHOODS: Record<string, {
  name: string;
  description: string;
  medianPrice: number;
  medianRent: number;
  taxRate: number;
  appreciationRate: number;
  latRange: [number, number];
  lngRange: [number, number];
  streets: string[];
}> = {
  centretown: {
    name: 'Centretown',
    description: 'High-density downtown core with urban condos and brick rowhouses.',
    medianPrice: 480000,
    medianRent: 2100,
    taxRate: 0.011,
    appreciationRate: 0.038,
    latRange: [45.4110, 45.4210],
    lngRange: [-75.7030, -75.6880],
    streets: ['Elgin St', 'Bank St', 'O\'Connor St', 'Metcalfe St', 'Gladstone Ave', 'Somerset St W', 'Gloucester St'],
  },
  glebe: {
    name: 'The Glebe',
    description: 'Prestigious historic neighborhood with quiet leafy avenues and high-end families.',
    medianPrice: 1200000,
    medianRent: 3800,
    taxRate: 0.010,
    appreciationRate: 0.045,
    latRange: [45.3960, 45.4080],
    lngRange: [-75.6960, -75.6780],
    streets: ['Clemow Ave', 'Powell Ave', 'O\'Connor St', 'Monkland Ave', 'Second Ave', 'Fourth Ave', 'Holmwood Ave'],
  },
  westboro: {
    name: 'Westboro',
    description: 'Trendy, boutique-filled neighborhood popular with active, affluent young families.',
    medianPrice: 980000,
    medianRent: 3300,
    taxRate: 0.010,
    appreciationRate: 0.052,
    latRange: [45.3920, 45.4030],
    lngRange: [-75.7600, -75.7420],
    streets: ['Richmond Rd', 'Byron Ave', 'Churchill Ave N', 'Cole Ave', 'Lanark Ave', 'Kirkwood Ave'],
  },
  sandyhill: {
    name: 'Sandy Hill',
    description: 'Adjacent to University of Ottawa, dominated by historic mansions turned student rooming houses.',
    medianPrice: 650000,
    medianRent: 2600,
    taxRate: 0.011,
    appreciationRate: 0.030,
    latRange: [45.4190, 45.4290],
    lngRange: [-75.6800, -75.6680],
    streets: ['Laurier Ave E', 'Osgoode St', 'Sweetland Ave', 'Nelson St', 'Chapel St', 'Blackburn Ave', 'Range Rd'],
  },
  kanata: {
    name: 'Kanata',
    description: 'Sparsely laid out tech-hub suburb with high salaries and single-family detached homes.',
    medianPrice: 720000,
    medianRent: 2500,
    taxRate: 0.010,
    appreciationRate: 0.041,
    latRange: [45.3120, 45.3350],
    lngRange: [-75.9100, -75.8850],
    streets: ['March Rd', 'Terry Fox Dr', 'Campeau Dr', 'Kanata Ave', 'Flamborough Way', 'Keyrock Dr'],
  },
  orleans: {
    name: 'Orléans',
    description: 'Family-friendly, highly bilingual eastern suburb offering affordable entry-level homes.',
    medianPrice: 620000,
    medianRent: 2300,
    taxRate: 0.010,
    appreciationRate: 0.035,
    latRange: [45.4550, 45.4780],
    lngRange: [-75.5200, -75.4850],
    streets: ['Innes Rd', 'St. Joseph Blvd', 'Jeanne d\'Arc Blvd', 'Charlemagne Blvd', 'Tenth Line Rd', 'Duford Dr'],
  },
};

export const UPGRADES_TEMPLATES: Omit<PropertyUpgrade, 'purchased'>[] = [
  {
    id: 'kitchen',
    name: 'Modern Kitchen Remodel',
    description: 'Install quartz countertops, premium stainless appliances, and custom cabinets.',
    cost: 25000,
    rentModifier: 1.12, // +12% rent
    valueModifier: 1.08, // +8% market value
  },
  {
    id: 'bathroom',
    name: 'Spa Bathroom Upgrade',
    description: 'Add a walk-in rain shower, dual vanity, heating floor, and high-end tile.',
    cost: 15000,
    rentModifier: 1.07, // +7% rent
    valueModifier: 1.05, // +5% market value
  },
  {
    id: 'hvac',
    name: 'Smart HVAC System',
    description: 'Replace ancient furnace with high-efficiency heat pump and smart thermostats.',
    cost: 12000,
    rentModifier: 1.04, // +4% rent (lower utility bills attract better tenants)
    valueModifier: 1.03, // +3% market value
  },
  {
    id: 'solar',
    name: 'Solar Energy Grid',
    description: 'Install rooftop solar panels. Tenants enjoy free electricity; pays for itself.',
    cost: 18000,
    rentModifier: 1.08, // +8% rent
    valueModifier: 1.04, // +4% market value
  },
  {
    id: 'curb',
    name: 'Curb Appeal & Landscaping',
    description: 'Fresh sod, concrete driveway coating, exterior accent lighting, and decorative trees.',
    cost: 8000,
    rentModifier: 1.03, // +3% rent
    valueModifier: 1.04, // +4% market value
  },
  {
    id: 'adu',
    name: 'Basement / ADU Conversion',
    description: 'Finish the basement or add an accessory dwelling unit to create an additional rental suite.',
    cost: 65000,
    rentModifier: 1.30, // +30% rent
    valueModifier: 1.20, // +20% market value
  },
];

export const ARCHETYPES: Record<string, Omit<Player, 'portfolio' | 'netWorthHistory'>> = {
  tech: {
    name: 'Kanata Tech Lead',
    archetype: 'Tech Lead',
    cash: 18000,
    salary: 110000,
    debt: 65000,
    monthlyDebtPayment: 550,
    creditScore: 720,
  },
  server: {
    name: 'Elgin Street Server',
    archetype: 'Service Worker',
    cash: 35000,
    salary: 45000,
    debt: 0,
    monthlyDebtPayment: 0,
    creditScore: 680,
  },
  heir: {
    name: 'Sandy Hill Heir',
    archetype: 'Inherited Landlord',
    cash: 12000,
    salary: 30000,
    debt: 0,
    monthlyDebtPayment: 0,
    creditScore: 620,
  },
  staffer: {
    name: 'Parliamentary Staffer',
    archetype: 'Public Servant',
    cash: 6000,
    salary: 75000,
    debt: 20000,
    monthlyDebtPayment: 220,
    creditScore: 780,
  },
};

export const AI_COMPETITORS_TEMPLATES: Omit<AICompetitor, 'portfolio'>[] = [
  {
    id: 'comp_devon',
    name: 'Devon Capital Inc.',
    avatar: '🏢',
    cash: 2500000,
    color: '#a855f7', // Violet
    aggression: 0.8,
  },
  {
    id: 'comp_sophia',
    name: 'Sophia Chen (Broker)',
    avatar: '👩‍💼',
    cash: 600000,
    color: '#f97316', // Orange
    aggression: 0.5,
  },
  {
    id: 'comp_vanguard',
    name: 'Marcus Vance',
    avatar: '👨‍💼',
    cash: 350000,
    color: '#10b981', // Emerald Green
    aggression: 0.65,
  },
];
