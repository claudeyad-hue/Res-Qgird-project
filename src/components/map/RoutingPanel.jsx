import React from 'react';

/**
 * RoutingPanel — floating information panel shown when a route is active.
 * Displays destination name, actual road distance, ETA, and route status.
 *
 * Props:
 *   incidentRoute: route object | null
 *   hospitalRoute: route object | null
 *   incidentName: string
 *   hospitalName: string
 *   nearestHospital: { hospital, distance, distanceType } | null
 *   isLoadingIncident: boolean
 *   isLoadingHospital: boolean
 *   isLoadingNearest: boolean
 *   onClearRoutes: () => void
 */
export default function RoutingPanel({
  incidentRoute,
  hospitalRoute,
  incidentName,
  hospitalName,
  nearestHospital,
  isLoadingIncident,
  isLoadingHospital,
  isLoadingNearest,
  onClearRoutes,
}) {
  const hasAnyRoute =
    incidentRoute ||
    hospitalRoute ||
    nearestHospital ||
    isLoadingIncident ||
    isLoadingHospital ||
    isLoadingNearest;

  if (!hasAnyRoute) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '36px',
        right: '14px',
        zIndex: 1000,
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        width: '260px',
        overflow: 'hidden',
        fontFamily: 'inherit',
      }}
      role="region"
      aria-label="Route information panel"
    >
      {/* Panel header */}
      <div
        style={{
          background: 'var(--primary)',
          color: '#fff',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', opacity: 0.9 }}>
          GHAZIABAD ROUTING & DISPATCH
        </span>
        <button
          type="button"
          onClick={onClearRoutes}
          aria-label="Clear all routes"
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
            opacity: 0.8,
            padding: '0 2px',
          }}
          title="Clear routes"
        >
          ✕
        </button>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Loading: incident route */}
        {isLoadingIncident && (
          <LoadingRow label="Calculating road route to incident…" color="#2F6FE0" />
        )}

        {/* Loading: nearest hospital */}
        {isLoadingNearest && (
          <LoadingRow label="Ranking eligible Ghaziabad hospitals…" color="#27AE60" />
        )}

        {/* Loading: hospital route */}
        {isLoadingHospital && (
          <LoadingRow label="Calculating road route to hospital…" color="#27AE60" />
        )}

        {/* Incident route result */}
        {incidentRoute && !isLoadingIncident && (
          <RouteCard
            icon="🚨"
            color="#2F6FE0"
            label="Route to Incident"
            name={incidentName || 'Incident'}
            route={incidentRoute}
          />
        )}

        {/* Nearest hospital info (dynamic triage result) */}
        {nearestHospital && !hospitalRoute && !isLoadingHospital && !isLoadingNearest && (
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink-muted)', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Nearest Suitable Hospital
            </div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)', marginBottom: '4px' }}>
              🏥 {nearestHospital.hospital.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px' }}>
              <StatBox label="Straight-Line" value={`${nearestHospital.distance} km`} />
              <StatBox label="Status" value={nearestHospital.hospital.status || 'Active'} />
              <StatBox label="Beds Avail" value={`${nearestHospital.hospital.bedsAvail ?? '?'}/${nearestHospital.hospital.bedsTotal ?? '?'}`} />
              <StatBox label="ICU Avail" value={`${nearestHospital.hospital.icuAvail ?? '?'}/${nearestHospital.hospital.icuTotal ?? '?'}`} />
            </div>
            <div style={{ marginTop: '5px', fontSize: '10px', color: 'var(--ink-muted)' }}>
              📍 Measurement: Straight-line (Haversine). Click "Route to Hospital" for road routing.
            </div>
            {nearestHospital.hospital.contact && (
              <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--ink-muted)' }}>
                📞 {nearestHospital.hospital.contact}
              </div>
            )}
          </div>
        )}

        {/* Hospital route result */}
        {hospitalRoute && !isLoadingHospital && (
          <RouteCard
            icon="🏥"
            color="#27AE60"
            label="Route to Hospital"
            name={hospitalName || 'Hospital'}
            route={hospitalRoute}
          />
        )}
      </div>
    </div>
  );
}

function RouteCard({ icon, color, label, name, route }) {
  const isOk = route.status === 'ok';
  return (
    <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
      <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink-muted)', letterSpacing: '0.05em', marginBottom: '5px' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '13px', color, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <span>{icon}</span>
        <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{name}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px' }}>
        <StatBox label="Road Distance" value={isOk ? `${route.distanceKm} km` : 'Unavailable'} />
        <StatBox label="Road ETA" value={isOk ? `${route.durationMin} min` : 'Unavailable'} />
      </div>
      {!isOk && route.message && (
        <div style={{ marginTop: '5px', fontSize: '10.5px', color: '#E74C3C', lineHeight: 1.4, background: 'rgba(231,76,60,0.08)', padding: '4px 6px', borderRadius: '4px' }}>
          ✕ {route.message}
        </div>
      )}
      {isOk && (
        <div style={{ marginTop: '5px', fontSize: '10.5px', color: '#27AE60', fontWeight: 600 }}>
          ✓ Verified road route (OSRM engine)
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div style={{ background: 'var(--surface-2)', borderRadius: '6px', padding: '5px 8px' }}>
      <div style={{ fontSize: '9.5px', textTransform: 'uppercase', color: 'var(--ink-muted)', letterSpacing: '0.04em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
}

function LoadingRow({ label, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--ink-muted)' }}>
      <span
        style={{
          width: '10px', height: '10px', borderRadius: '50%',
          background: color, opacity: 0.8,
          animation: 'pulseDot 1.2s infinite',
          flexShrink: 0,
        }}
      />
      {label}
    </div>
  );
}
