# Real Estate Empire - Ottawa Scoping & Implementation Plan (Approved)

This plan outlines the design and implementation details for the Ottawa-focused prototype of **Real Estate Empire**, incorporating user feedback:
- **Location:** Ottawa, Ontario, Canada.
- **Time Scale:** Accelerated (e.g., 1 game day = 1 real-world minute; 1 game year = ~6 hours).
- **Map Visuals:** High-fidelity satellite imagery (Esri World Imagery) with transparent road/label overlays for a premium, tactical "Google Earth" feel.
- **Tech Stack:** React (Vite) + TypeScript + Tailwind/CSS for the prototype front-end dashboard, using client-side persistence (LocalStorage/IndexedDB) and structured mock multiplayer activity.

---

## 1. Game Design & Parameters (Ottawa Specific)

### 1.1 Neighborhood Profiles
We will seed the database with actual Ottawa neighborhoods:

| Neighborhood | Vibe / Profile | Median Home Price | Median Monthly Rent | Property Tax Rate | Growth Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **The Glebe** | Historic, high-end residential, leafy streets | $1,200,000 | $3,800 | 1.0% | +4.5% / yr |
| **Centretown** | Urban core, high-density condos, commercial | $480,000 | $2,100 | 1.1% | +3.8% / yr |
| **Westboro** | Trendy, boutique shops, upscale families | $980,000 | $3,300 | 1.0% | +5.2% / yr |
| **Sandy Hill** | Near Uni of Ottawa, student rental hub | $650,000 | $2,600 | 1.1% | +3.0% / yr |
| **Kanata** | Western suburbs, high-tech hub, families | $720,000 | $2,500 | 1.0% | +4.1% / yr |
| **Orléans** | Eastern suburbs, bilingual, affordable | $620,000 | $2,300 | 1.0% | +3.5% / yr |

### 1.2 Backstories & Starting Stats
Balanced starting configurations tailored for Ottawa:
1. **The Kanata Tech Worker:** Starting salary $110,000 CAD, living in Kanata, $15,000 savings, $60k student debt. High DTI.
2. **The Elgin Street Server:** Starting salary $45,000 CAD, living in Centretown, $35,000 savings, $0 debt. Ready for down payment.
3. **The Sandy Hill Landlord Heir:** Starting salary $30,000 CAD, living in Sandy Hill, inherits a rundown triplex (worth $700k, needs $60k renovations), $10,000 cash.
4. **The Parliament staffer:** Starting salary $75,000 CAD, living in The Glebe, $5,000 savings, $20k student debt. Excellent credit (780).

### 1.3 Accelerated Time Loop
- **1 Game Minute** = 0.5 real seconds.
- **1 Game Day** = 12 real seconds.
- **1 Game Month** = 6 real minutes.
  - Cash flow updates (rents received, mortgage payments, maintenance costs deducted) happen at the start of each game month.
  - Daily market trends (micro-fluctuations in property prices) happen daily.

---

## 2. Visuals & Map Integration

### 2.1 The "Google Earth" Style Satellite Map
- **Base Map:** Esri World Imagery (high-resolution satellite tiles).
- **Overlay:** CartoDB Dark Matter / Positron transparent labels & roads to keep map readable.
- **Glow Effects:** Selected property parcels and pins will have neon/cyber-hud glow styles (e.g., green for owned, blue for for-sale, red for competitor-owned).
- **Interactive Details:** Clicking a property displays a custom floating HUD panel with satellite zoom-in, street address, local market value, cash flow yield, and purchase buttons.

---

## 3. Implementation Checklist

### Phase 1: Project Setup & Map Core
- [ ] Initialize React + TypeScript + Tailwind CSS project with Vite.
- [ ] Set up Leaflet map with Satellite and Label overlays centered on Ottawa.
- [ ] Implement coordinates-to-address generator for Ottawa streets (Wellington, Bank, Elgin, Richmond, etc.).

### Phase 2: Game State & Player Dashboard
- [ ] Implement player profile creation (archetype selector).
- [ ] Create dashboard UI showing: Net Worth, Cash Balance, Monthly Cash Flow, Debt, Game Date/Time.
- [ ] Set up the accelerated game loop timer (Zustand/Context state).

### Phase 3: Property Purchase & Management
- [ ] Generate real estate listings dynamically on the map.
- [ ] Implement mortgage calculator, buying flow, and selling flow.
- [ ] Implement property upgrades (e.g., renovate kitchen +10% value, add suite +25% rent).

### Phase 4: Simulated Multiplayer & Polish
- [ ] Create AI competitors who buy properties and compete for listings.
- [ ] Implement leaderboard.
- [ ] Visual polish (dark mode UI, animations, chart dashboard for portfolio value).
