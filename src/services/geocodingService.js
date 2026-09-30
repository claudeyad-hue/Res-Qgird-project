// Reverse Geocoding Service (Section M)
// Connects to OpenStreetMap Nominatim with in-memory caching and fallback to coordinates.
// Gracefully handles rate limits, offline states, and timeouts without crashing the map.

const cache = new Map();

export const geocodingService = {
  /**
   * Reverse geocodes [latitude, longitude] to a human-readable location address.
   * If geocoding fails or is throttled, falls back to formatted coordinates string.
   * @param {number} latitude
   * @param {number} longitude
   * @returns {Promise<{ address: string, details?: any, isFallback: boolean }>}
   */
  async reverseGeocode(latitude, longitude) {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return { address: 'Coordinates unavailable', isFallback: true };
    }

    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    if (cache.has(cacheKey)) {
      return { address: cache.get(cacheKey), isFallback: false };
    }

    const fallbackAddress = `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`;
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ResQuard-DisasterResponse/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return { address: fallbackAddress, isFallback: true };
      }

      const data = await res.json();
      if (data && data.display_name) {
        // Construct concise address from components
        const addr = data.address || {};
        const parts = [
          addr.suburb || addr.neighbourhood || addr.road || addr.village,
          addr.city || addr.town || addr.county || addr.district,
          addr.state,
        ].filter(Boolean);

        const cleanAddress = parts.length > 0 ? parts.join(', ') : data.display_name.split(',').slice(0, 3).join(',');
        cache.set(cacheKey, cleanAddress);
        return { address: cleanAddress, details: data, isFallback: false };
      }

      return { address: fallbackAddress, isFallback: true };
    } catch {
      // Graceful fallback for network errors, aborts, or CORS issues
      return { address: fallbackAddress, isFallback: true };
    }
  },
};
