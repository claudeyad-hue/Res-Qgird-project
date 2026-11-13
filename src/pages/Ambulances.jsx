import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import Header from '../components/layout/Header';
import StatCard from '../components/common/StatCard';
import ambulanceApiService from '../services/ambulanceApiService';
import { API_BASE } from '../services/apiConfig';
import 'leaflet/dist/leaflet.css';

const categories = [
  ['government-108', 'Government 108'], ['government-102', 'Government 102'], ['als', 'ALS'], ['bls', 'BLS'], ['private', 'Private providers'], ['hospital-based', 'Hospital based'],
];
const icon = L.divIcon({ className: 'ambulance-map-marker', html: '🚑', iconSize: [32, 32], iconAnchor: [16, 16] });
const display = (value) => value || 'Unknown';
const dateLabel = (value) => value ? new Date(value).toLocaleDateString() : 'Unknown';
const verificationLabel = (value) => ({ 'official-source': 'Official source listing', 'provider-confirmed': 'Provider confirmed', 'directory-listed': 'Directory listing', unverified: 'Unverified' }[value] || value || 'Unverified');

export default function Ambulances() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [area, setArea] = useState('');
  const [loading, setLoading] = useState(Boolean(API_BASE));
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    ambulanceApiService.getAmbulances({ limit: 100 }).then((data) => {
      if (!cancelled && data) setRecords(data);
    }).catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const shown = useMemo(() => records.filter((record) => {
    if (category !== 'all' && record.category !== category) return false;
    const text = `${record.name} ${record.providerName} ${record.serviceType} ${record.address || ''} ${record.city || ''} ${record.district || ''} ${record.contactNumber || ''}`.toLowerCase();
    const areaText = `${record.address || ''} ${record.city || ''} ${record.district || ''}`.toLowerCase();
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (!area.trim() || areaText.includes(area.trim().toLowerCase()));
  }), [records, category, search, area]);
  const mapped = shown.filter((record) => record.location?.type === 'Point' && Array.isArray(record.location.coordinates) && ['official-source', 'provider-confirmed'].includes(record.verificationStatus));
  const governmentCount = shown.filter((record) => record.ownership === 'government').length;
  const privateCount = shown.filter((record) => record.ownership === 'private').length;

  return <>
    <Header title="Ambulance Services" subtitle="Source-attributed dispatch services and provider locations. Availability and live vehicle tracking are not connected." />
    <div className="screen-body ambulance-screen">
      <div className="hospital-data-notice" role="note">District-level 108/102 services are helplines, not individual vehicle locations. Only source-published provider locations appear on the map. Availability is Unknown unless a verified live feed is connected.</div>
      <div className="stat-grid stat-grid-3 ambulance-stats">
        <StatCard value={shown.length} label="Source-backed service records" />
        <StatCard value={mapped.length} label="Mapped provider locations" />
        <StatCard value="Not connected" label="Live vehicle tracking" />
      </div>
      <div className="hospital-filters ambulance-filters" aria-label="Ambulance service filters">
        <label>Search providers<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, service or phone" /></label>
        <label>Area<input type="search" value={area} onChange={(event) => setArea(event.target.value)} placeholder="City or district" /></label>
        <label>Service category<select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      {!API_BASE && <div className="ambulance-empty" role="status">Ambulance records require a connected backend. Set VITE_API_BASE_URL and start the API to load source-backed services.</div>}
      {error && <div className="ambulance-error" role="alert">{error}</div>}
      {loading && <div className="ambulance-empty" role="status">Loading ambulance services…</div>}
      <section className="ambulance-map-section" aria-label="Verified provider map">
        <h2>Provider locations</h2>
        {mapped.length ? <MapContainer className="ambulance-map" center={[mapped[0].location.coordinates[1], mapped[0].location.coordinates[0]]} zoom={12} scrollWheelZoom={false}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {mapped.map((record) => <Marker key={record.id} position={[record.location.coordinates[1], record.location.coordinates[0]]} icon={icon}><Popup><strong>{record.name}</strong><br />{record.providerName}<br />{display(record.address)}<br />{record.contactNumber && <a href={`tel:${record.contactNumber}`}>{record.contactNumber}</a>}<br />{record.verificationStatus}</Popup></Marker>)}
        </MapContainer> : <div className="ambulance-map-empty">No source-verified provider locations match these filters. District service coverage is not shown as a vehicle or provider marker.</div>}
      </section>
      <section aria-label="Ambulance provider listings" className="ambulance-list-section">
        <h2>Service directory</h2>
        {!loading && API_BASE && shown.length === 0 && <div className="ambulance-empty">No source-backed ambulance records match these filters.</div>}
        <div className="ambulance-cards">{shown.map((record) => <article className="ambulance-card" key={record.id}>
          <div className="ambulance-card-top"><div><span className={`ambulance-class ${record.ownership === 'government' ? 'government' : record.ownership === 'private' ? 'private' : ''}`}>{record.ownership || 'unknown'} · {categories.find(([value]) => value === record.category)?.[1] || record.category}</span><h3>{record.name}</h3><p>{record.providerName}</p></div><span className="ambulance-verification">{record.verificationStatus === 'official-source' || record.verificationStatus === 'provider-confirmed' ? '✓ ' : ''}{verificationLabel(record.verificationStatus)}</span></div>
          <dl><dt>Service</dt><dd>{display(record.serviceType)}</dd><dt>Area</dt><dd>{[record.city, record.district, record.state].filter(Boolean).join(', ') || 'Unknown'}</dd><dt>Address</dt><dd>{display(record.address)}</dd><dt>Vehicle / facilities</dt><dd>{record.vehicleType || (record.facilities?.length ? record.facilities.join(', ') : 'Unknown')}</dd><dt>Availability</dt><dd>{record.availabilityStatus || 'Unknown'}</dd><dt>Last verified</dt><dd>{dateLabel(record.lastVerifiedAt)}</dd><dt>Source page updated</dt><dd>{dateLabel(record.sourcePublishedAt)}</dd>{record.publishedFleetCount != null && <><dt>Published district fleet count</dt><dd>{record.publishedFleetCount} (aggregate; not individually mapped)</dd></>}</dl>
          <div className="ambulance-card-actions">{record.contactNumber ? <a className="ambulance-call" href={`tel:${record.contactNumber}`}>Call {record.contactNumber}</a> : <span className="ambulance-call disabled">Contact unknown</span>}<a href={record.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a></div>
        </article>)}</div>
      </section>
      <div className="ambulance-data-note">Showing {governmentCount} government and {privateCount} private records in the current results. Other provider records will appear after source review; unavailable fields remain Unknown.</div>
    </div>
  </>;
}
