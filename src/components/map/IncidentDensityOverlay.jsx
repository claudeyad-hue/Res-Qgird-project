import React, { useMemo } from 'react';
import { Circle } from 'react-leaflet';

export default function IncidentDensityOverlay({ incidents }) {
  // Aggregate incidents by geographic clusters (approx 0.5-degree grid)
  const densityHubs = useMemo(() => {
    if (!incidents || incidents.length === 0) return [];

    const hubs = {};
    incidents.forEach((inc) => {
      if (typeof inc.latitude !== 'number' || typeof inc.longitude !== 'number') return;
      // round to 0.4 degree cell
      const key = `${(Math.round(inc.latitude * 2.5) / 2.5).toFixed(2)},${(Math.round(inc.longitude * 2.5) / 2.5).toFixed(2)}`;
      if (!hubs[key]) {
        hubs[key] = {
          lat: inc.latitude,
          lng: inc.longitude,
          count: 0,
          totalAffected: 0,
          hasCritical: false,
        };
      }
      hubs[key].count += 1;
      hubs[key].totalAffected += inc.affectedPeople || inc.affected || 0;
      if (String(inc.severity).toLowerCase() === 'critical') {
        hubs[key].hasCritical = true;
      }
    });

    return Object.values(hubs);
  }, [incidents]);

  return (
    <>
      {densityHubs.map((hub, idx) => {
        const radius = Math.min(65000, 25000 + hub.count * 12000);
        const color = hub.hasCritical ? '#C0392B' : '#E67E22';
        const opacity = Math.min(0.35, 0.15 + hub.count * 0.05);

        return (
          <React.Fragment key={`density-${idx}`}>
            {/* Outer soft ambient density ring */}
            <Circle
              center={[hub.lat, hub.lng]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: opacity * 0.6,
                weight: 1,
                dashArray: '2, 6',
              }}
            />
            {/* Inner core density ring */}
            <Circle
              center={[hub.lat, hub.lng]}
              radius={radius * 0.45}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: opacity,
                weight: 2,
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
