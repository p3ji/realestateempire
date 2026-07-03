# Real Estate Empire — Ottawa

A real-time real estate investment game played on a real map of Ottawa. Buy actual buildings
(sourced live from OpenStreetMap), finance them with mortgages, renovate, collect rent, and
out-invest three AI competitors.

## Run it

```bash
npm install
npm run dev
```

## How it works

- **Real listings**: on new game, the app queries the Overpass API for addressed buildings inside
  six Ottawa neighborhoods (Centretown, The Glebe, Westboro, Sandy Hill, Kanata, Orléans) and turns
  them into purchasable properties — real addresses, real coordinates, real building types
  (see [src/osm.ts](src/osm.ts)). Results are cached in localStorage; if the fetch fails the game
  falls back to synthetic listings.
- **Two map styles** (toggle top-left): **City Map** — a warm, parchment-tinted street map with
  hand-drawn building tokens cropped from the sprite sheets in `images/`; **Satellite** — Esri
  World Imagery with a dark tactical tint.
- **Game loop**: 1 game day ≈ 1.5s (1×) or 0.35s (2×). Monthly cycle bills salary, rent, property
  tax, maintenance (worse condition = higher cost), amortized mortgage payments, and student debt.
- **Financing**: mortgage approval uses a 45% debt-to-income check where 80% of rental income
  (existing portfolio + the unit being bought) counts as qualifying income, so the down-payment
  slider matters.
- **Persistence**: the whole game state autosaves to localStorage every change.

## Sprite pipeline

Map tokens are cropped from the Gemini-generated sprite sheets in `images/` into
`public/sprites/*.png`. Each property carries a `sprite` name assigned from its OSM building tag
in [src/osm.ts](src/osm.ts) (`mapOsmBuilding`). To add a new building type:

1. Drop the art into `public/sprites/<name>.png` (roughly square, ~100–150px).
2. Map the OSM tag to it in `mapOsmBuilding`.
3. Optionally add a price weight in `SPRITE_PRICE_MULTIPLIERS` ([src/utils.ts](src/utils.ts)).

Current sprites: single_family, row_house, apartment, condo_tower, student_dorm, strip_mall,
office_tower, skyscraper_cluster, historic_hotel, mega_mall, supermarket, parking_garage,
warehouse, data_center, brewery, self_storage.
