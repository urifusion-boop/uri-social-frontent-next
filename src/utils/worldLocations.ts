/**
 * Country + continent reference data for the Listening location picker.
 *
 * Bundled client-side from `world-countries` (the same canonical ISO-3166 +
 * region dataset the backend's own geo.py loads from — see
 * uri-social-backend/app/agents/market_intelligence/listening/data/countries.json)
 * instead of fetched from the backend: this list is static reference data,
 * not live application state, so the picker must render instantly and stay
 * usable even if the backend is briefly unreachable. Only the business's
 * actual choice (a country/continent code, or a typed city name) is ever
 * sent to the backend, on save.
 */
import worldCountries from 'world-countries';

export interface WorldCountry {
  code: string;
  name: string;
  region: string;
}

export interface WorldContinent {
  code: string;
  label: string;
  countries: string[];
}

export const COUNTRIES: WorldCountry[] = worldCountries
  .filter((c) => c.region && c.region !== 'Antarctic')
  .map((c) => ({ code: c.cca2, name: c.name.common, region: c.region }))
  .sort((a, b) => a.name.localeCompare(b.name));

export const CONTINENTS: WorldContinent[] = Array.from(
  COUNTRIES.reduce((map, c) => {
    const code = c.region.toUpperCase().replace(/\s+/g, '_');
    if (!map.has(code)) map.set(code, { code, label: c.region, countries: [] as string[] });
    map.get(code)!.countries.push(c.code);
    return map;
  }, new Map<string, WorldContinent>()).values()
).sort((a, b) => a.label.localeCompare(b.label));

export const COUNTRY_NAME_BY_CODE: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.name]));
