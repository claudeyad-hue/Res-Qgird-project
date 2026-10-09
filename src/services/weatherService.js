// Weather Service — Open-Meteo Integration
// Free, open-source weather API. No API key required.
// Docs: https://open-meteo.com/en/docs
// Operational Scope: Ghaziabad, Uttar Pradesh, India [28.6692, 77.4538]

import { GHAZIABAD_CONFIG } from '../utils/geoUtils.js';

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const WMO_CODES = {
  0: { label: 'Clear sky', icon: '☀️' },
  1: { label: 'Mainly clear', icon: '🌤️' },
  2: { label: 'Partly cloudy', icon: '⛅' },
  3: { label: 'Overcast', icon: '☁️' },
  45: { label: 'Fog', icon: '🌫️' },
  48: { label: 'Icy fog', icon: '🌫️' },
  51: { label: 'Light drizzle', icon: '🌦️' },
  53: { label: 'Drizzle', icon: '🌦️' },
  55: { label: 'Heavy drizzle', icon: '🌧️' },
  61: { label: 'Slight rain', icon: '🌧️' },
  63: { label: 'Moderate rain', icon: '🌧️' },
  65: { label: 'Heavy rain', icon: '🌧️' },
  71: { label: 'Slight snow', icon: '🌨️' },
  73: { label: 'Moderate snow', icon: '❄️' },
  75: { label: 'Heavy snow', icon: '❄️' },
  80: { label: 'Rain showers', icon: '🌦️' },
  81: { label: 'Moderate showers', icon: '🌧️' },
  82: { label: 'Violent showers', icon: '⛈️' },
  95: { label: 'Thunderstorm', icon: '⛈️' },
  96: { label: 'Thunderstorm + hail', icon: '⛈️' },
  99: { label: 'Thunderstorm + heavy hail', icon: '⛈️' },
};

let cache = null;
let cacheTime = 0;

export const weatherService = {
  /**
   * Fetch current weather for Ghaziabad operational area from Open-Meteo.
   * Returns cached result within 10 minutes.
   * Falls back gracefully on network failure.
   *
   * @returns {Promise<{
   *   temperature: number,
   *   windspeed: number,
   *   winddirection: number,
   *   weathercode: number,
   *   label: string,
   *   icon: string,
   *   isDay: boolean,
   *   time: string,
   *   isFallback: boolean,
   *   source: string
   * }>}
   */
  async getCurrentWeather() {
    const now = Date.now();
    if (cache && now - cacheTime < CACHE_TTL_MS) {
      return cache;
    }

    const [lat, lng] = GHAZIABAD_CONFIG.center;
    const url =
      `${BASE_URL}?latitude=${lat}&longitude=${lng}` +
      `&current_weather=true&timezone=Asia%2FKolkata` +
      `&windspeed_unit=kmh`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Open-Meteo HTTP ${res.status}`);
      }

      const data = await res.json();
      const cw = data.current_weather;
      if (!cw) throw new Error('Open-Meteo: no current_weather in response');

      const wmo = WMO_CODES[cw.weathercode] || { label: 'Unknown', icon: '🌡️' };

      const result = {
        temperature: cw.temperature,
        windspeed: cw.windspeed,
        winddirection: cw.winddirection,
        weathercode: cw.weathercode,
        label: wmo.label,
        icon: wmo.icon,
        isDay: cw.is_day === 1,
        time: cw.time,
        isFallback: false,
        source: 'Open-Meteo (open-meteo.com)',
      };

      cache = result;
      cacheTime = now;
      return result;
    } catch (err) {
      // Graceful fallback — never crash the map
      return {
        temperature: null,
        windspeed: null,
        winddirection: null,
        weathercode: null,
        label: 'Weather unavailable',
        icon: '🌡️',
        isDay: true,
        time: null,
        isFallback: true,
        source: 'Open-Meteo (offline)',
        error: err.message,
      };
    }
  },

  /**
   * Returns severity-based weather advisory for disaster operations.
   * Used to warn dispatch teams of hazardous weather.
   */
  getWeatherAdvisory(weather) {
    if (!weather || weather.isFallback) return null;
    const code = weather.weathercode;
    if (code >= 95) return { level: 'critical', message: 'Thunderstorm active — suspend aerial ops' };
    if (code >= 80) return { level: 'high', message: 'Rain showers — visibility reduced' };
    if (code >= 61) return { level: 'medium', message: 'Rain — road traction affected' };
    if (code >= 45) return { level: 'medium', message: 'Fog — restrict vehicle speed' };
    if (weather.windspeed > 50) return { level: 'high', message: `High winds ${weather.windspeed} km/h` };
    return null;
  },
};

export default weatherService;
