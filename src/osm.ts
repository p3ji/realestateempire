import { NEIGHBORHOODS } from './constants';
import type { PropertyType } from './types';

// Real building listings pulled from OpenStreetMap via the Overpass API.
// Every listing is an actual addressed building inside one of the game's
// Ottawa neighborhood bounding boxes.

export interface OsmBuilding {
  osmId: number;
  lat: number;
  lng: number;
  address: string;
  gameType: PropertyType;
  sprite: string;
  levels: number;
  name: string | null;
}

export type OsmListings = Record<string, OsmBuilding[]>; // keyed by neighborhood

const OSM_CACHE_KEY = 'real_estate_empire_osm_listings_v1';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const PER_NEIGHBORHOOD_FETCH = 80;
const FETCH_TIMEOUT_MS = 12000;

interface OverpassElement {
  type: string;
  id: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Map an OSM building tag set to a game property type + sprite.
// Returns null for building kinds the game shouldn't sell (churches, schools, sheds...).
export const mapOsmBuilding = (
  tags: Record<string, string>
): { gameType: PropertyType; sprite: string } | null => {
  const b = (tags['building'] || '').toLowerCase();
  const shop = (tags['shop'] || '').toLowerCase();
  const levels = parseInt(tags['building:levels'] || '0', 10) || 0;

  // Non-purchasable civic / utility / junk structures
  const skip = [
    'church', 'cathedral', 'chapel', 'mosque', 'synagogue', 'temple', 'religious',
    'school', 'university', 'college', 'kindergarten', 'hospital', 'civic',
    'government', 'public', 'fire_station', 'train_station', 'transportation',
    'garage', 'garages', 'shed', 'roof', 'carport', 'hut', 'ruins',
    'construction', 'greenhouse', 'stadium', 'grandstand', 'toilets', 'bridge',
  ];
  if (skip.includes(b)) return null;

  // Residential
  if (['house', 'detached', 'semidetached_house', 'semi', 'bungalow', 'farm', 'villa'].includes(b)) {
    return { gameType: 'residential', sprite: 'single_family' };
  }
  if (['terrace', 'townhouse', 'row_house'].includes(b)) {
    return { gameType: 'residential', sprite: 'row_house' };
  }
  if (b === 'dormitory') {
    return { gameType: 'residential', sprite: 'student_dorm' };
  }
  if (b === 'apartments' || b === 'tower') {
    return { gameType: 'residential', sprite: levels >= 6 ? 'condo_tower' : 'apartment' };
  }
  if (b === 'residential') {
    return { gameType: 'residential', sprite: levels >= 4 ? 'apartment' : 'row_house' };
  }

  // Commercial
  if (b === 'hotel') return { gameType: 'commercial', sprite: 'historic_hotel' };
  if (b === 'supermarket' || shop === 'supermarket') {
    return { gameType: 'commercial', sprite: 'supermarket' };
  }
  if (b === 'mall') return { gameType: 'commercial', sprite: 'mega_mall' };
  if (b === 'parking') return { gameType: 'commercial', sprite: 'parking_garage' };
  if (b === 'office') {
    return { gameType: 'commercial', sprite: levels >= 8 ? 'skyscraper_cluster' : 'office_tower' };
  }
  if (['retail', 'commercial', 'kiosk'].includes(b) || shop) {
    return { gameType: 'commercial', sprite: 'strip_mall' };
  }

  // Industrial
  if (b === 'warehouse') return { gameType: 'industrial', sprite: 'warehouse' };
  if (b === 'brewery' || tags['craft'] === 'brewery') {
    return { gameType: 'industrial', sprite: 'brewery' };
  }
  if (b === 'storage' || tags['self_storage']) {
    return { gameType: 'industrial', sprite: 'self_storage' };
  }
  if (b === 'industrial' || b === 'manufacture' || b === 'service') {
    return { gameType: 'industrial', sprite: 'warehouse' };
  }
  if (b === 'data_center' || tags['telecom'] === 'data_center') {
    return { gameType: 'industrial', sprite: 'data_center' };
  }

  // Unknown / generic 'yes' buildings: not enough info to price honestly
  return null;
};

const buildQuery = (): string => {
  const statements = Object.values(NEIGHBORHOODS)
    .map(n => {
      const bbox = `${n.latRange[0]},${n.lngRange[0]},${n.latRange[1]},${n.lngRange[1]}`;
      return `way["building"]["addr:housenumber"]["addr:street"](${bbox});out tags center ${PER_NEIGHBORHOOD_FETCH};`;
    })
    .join('\n');
  return `[out:json][timeout:25];\n${statements}`;
};

const bucketByNeighborhood = (elements: OverpassElement[]): OsmListings => {
  const listings: OsmListings = {};
  Object.keys(NEIGHBORHOODS).forEach(k => { listings[k] = []; });

  const seenAddresses = new Set<string>();

  elements.forEach(el => {
    if (!el.center || !el.tags) return;
    const mapped = mapOsmBuilding(el.tags);
    if (!mapped) return;

    const address = `${el.tags['addr:housenumber']} ${el.tags['addr:street']}`;
    if (seenAddresses.has(address)) return;

    const { lat, lon } = el.center;
    const hoodKey = Object.entries(NEIGHBORHOODS).find(([, n]) =>
      lat >= n.latRange[0] && lat <= n.latRange[1] &&
      lon >= n.lngRange[0] && lon <= n.lngRange[1]
    )?.[0];
    if (!hoodKey) return;

    seenAddresses.add(address);
    listings[hoodKey].push({
      osmId: el.id,
      lat,
      lng: lon,
      address,
      gameType: mapped.gameType,
      sprite: mapped.sprite,
      levels: parseInt(el.tags['building:levels'] || '0', 10) || 0,
      name: el.tags['name'] || null,
    });
  });

  return listings;
};

// Spread a neighborhood's picks across building variety: lead with
// commercial/industrial diversity, fill the rest with residential.
const samplePerNeighborhood = (buildings: OsmBuilding[], count: number): OsmBuilding[] => {
  const bySprite: Record<string, OsmBuilding[]> = {};
  buildings.forEach(bld => {
    (bySprite[bld.sprite] = bySprite[bld.sprite] || []).push(bld);
  });

  const picked: OsmBuilding[] = [];
  const spriteKeys = Object.keys(bySprite);
  let round = 0;
  while (picked.length < count && round < 20) {
    for (const key of spriteKeys) {
      const pool = bySprite[key];
      if (round < pool.length && picked.length < count) {
        picked.push(pool[round]);
      }
    }
    round++;
  }
  return picked;
};

let inflight: Promise<OsmListings | null> | null = null;

export const fetchRealListings = (perNeighborhood = 10): Promise<OsmListings | null> => {
  if (inflight) return inflight;

  inflight = (async () => {
    // Cached from a previous session?
    try {
      const cached = localStorage.getItem(OSM_CACHE_KEY);
      if (cached) return JSON.parse(cached) as OsmListings;
    } catch { /* fall through to network */ }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(OVERPASS_URL, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(buildQuery()),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;

      const data = await res.json();
      const bucketed = bucketByNeighborhood(data.elements || []);

      const sampled: OsmListings = {};
      Object.entries(bucketed).forEach(([key, blds]) => {
        sampled[key] = samplePerNeighborhood(blds, perNeighborhood);
      });

      localStorage.setItem(OSM_CACHE_KEY, JSON.stringify(sampled));
      return sampled;
    } catch (e) {
      console.warn('OSM listing fetch failed, will use synthetic listings', e);
      return null;
    }
  })();

  return inflight;
};

export const clearListingsCache = () => {
  localStorage.removeItem(OSM_CACHE_KEY);
  inflight = null;
};
