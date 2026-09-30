// Routing Service (Section P)
// Generates accurate navigation links using user's current GPS position when available.
// Never fabricates distance, ETA, or false routes.

export const routingService = {
  /**
   * Generates a navigation link to the incident location.
   * @param {{ latitude: number, longitude: number, title?: string }} destination
   * @param {{ latitude: number, longitude: number } | null} origin
   * @returns {{ url: string, provider: string, hasOrigin: boolean }}
   */
  getDirectionsUrl(destination, origin = null) {
    const destLat = destination.latitude;
    const destLng = destination.longitude;

    if (origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') {
      const origLat = origin.latitude;
      const origLng = origin.longitude;
      // Google Maps directions with origin and destination
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origLat},${origLng}&destination=${destLat},${destLng}&travelmode=driving`;
      return {
        url,
        provider: 'Google Maps / GPS Route',
        hasOrigin: true,
      };
    }

    // Fallback when user GPS is not yet acquired
    const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${destLat},${destLng}`;
    return {
      url: fallbackUrl,
      provider: 'Google Maps Location',
      hasOrigin: false,
    };
  },

  /**
   * Generates OpenStreetMap directions link
   */
  getOsmDirectionsUrl(destination, origin = null) {
    const destLat = destination.latitude;
    const destLng = destination.longitude;
    if (origin) {
      return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${origin.latitude}%2C${origin.longitude}%3B${destLat}%2C${destLng}`;
    }
    return `https://www.openstreetmap.org/?mlat=${destLat}&mlon=${destLng}#map=15/${destLat}/${destLng}`;
  },
};
