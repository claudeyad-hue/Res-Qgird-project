import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import { INCIDENT_TYPES, INCIDENT_SEVERITIES } from '../../data/demoIncidents';
import { geocodingService } from '../../services/geocodingService';

export default function ReportIncidentMapModal({
  isOpen,
  onClose,
  onSubmit,
  initialCoords = null,
  userLocation = null,
  onPickOnMap = null,
}) {
  const [type, setType] = useState('Flood');
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [affectedPeople, setAffectedPeople] = useState('');
  const [latitude, setLatitude] = useState(28.6139);
  const [longitude, setLongitude] = useState(77.2090);
  const [address, setAddress] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);

  const fetchAddress = useCallback(async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const result = await geocodingService.reverseGeocode(lat, lng);
      setAddress(result.address);
    } catch {
      setAddress(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
    } finally {
      setIsGeocoding(false);
    }
  }, []);

  // Sync coords when modal opens or initialCoords change
  useEffect(() => {
    if (!isOpen) return;

    let targetLat = 28.6139;
    let targetLng = 77.2090;

    if (initialCoords && typeof initialCoords.latitude === 'number') {
      targetLat = initialCoords.latitude;
      targetLng = initialCoords.longitude;
    } else if (userLocation && typeof userLocation.latitude === 'number') {
      targetLat = userLocation.latitude;
      targetLng = userLocation.longitude;
    }

    setLatitude(targetLat);
    setLongitude(targetLng);
    fetchAddress(targetLat, targetLng);
  }, [isOpen, initialCoords, userLocation, fetchAddress]);

  const handleUseGps = () => {
    if (userLocation) {
      setLatitude(userLocation.latitude);
      setLongitude(userLocation.longitude);
      fetchAddress(userLocation.latitude, userLocation.longitude);
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          fetchAddress(lat, lng);
        },
        (err) => {
          alert(`GPS unavailable: ${err.message}`);
        },
        { timeout: 8000 }
      );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      type,
      title: title.trim() || `${type} Incident`,
      severity,
      description: description.trim() || 'Urgent incident reported from field.',
      affectedPeople: parseInt(affectedPeople, 10) || 0,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address.trim() || `${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Emergency Incident">
      <form onSubmit={handleSubmit}>
        {/* Incident Type & Severity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="field">
            <label htmlFor="rim-type">Incident Type</label>
            <select
              id="rim-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                padding: '0 10px',
                background: 'var(--surface)',
                color: 'var(--ink)',
              }}
            >
              {INCIDENT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="rim-sev">Severity Level</label>
            <select
              id="rim-sev"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                border: '1px solid var(--line)',
                padding: '0 10px',
                background: 'var(--surface)',
                color: 'var(--ink)',
              }}
            >
              {INCIDENT_SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="field">
          <label htmlFor="rim-title">Incident Title / Summary</label>
          <input
            id="rim-title"
            placeholder="e.g. Flash Flood Inundation near Low-lying Sector"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="field">
          <label htmlFor="rim-desc">Situation Description</label>
          <textarea
            id="rim-desc"
            rows={3}
            placeholder="Describe extent of danger, stranded persons, access road blocks..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              padding: '10px 14px',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Affected People */}
        <div className="field">
          <label htmlFor="rim-aff">People Affected / At Risk (est.)</label>
          <input
            id="rim-aff"
            type="number"
            min="0"
            step="1"
            placeholder="e.g. 50"
            value={affectedPeople}
            onChange={(e) => setAffectedPeople(e.target.value)}
          />
        </div>

        {/* Location Review Box */}
        <div
          style={{
            background: 'var(--surface-2)',
            padding: '14px',
            borderRadius: '8px',
            marginBottom: '16px',
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase' }}>
              Incident Coordinates & Address
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="link-btn"
                style={{ fontSize: '12px' }}
                onClick={handleUseGps}
              >
                🎯 Use My GPS
              </button>
              {onPickOnMap && (
                <button
                  type="button"
                  className="link-btn"
                  style={{ fontSize: '12px' }}
                  onClick={() => {
                    onClose();
                    onPickOnMap();
                  }}
                >
                  🗺 Pick on Map
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12.5px' }}>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>Lat:</span> {latitude.toFixed(6)}
            </div>
            <div>
              <span style={{ color: 'var(--ink-muted)' }}>Lng:</span> {longitude.toFixed(6)}
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '12.5px' }}>
            <span style={{ color: 'var(--ink-muted)' }}>Detected Address: </span>
            <strong>{isGeocoding ? 'Detecting address…' : address || 'Pending'}</strong>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button className="btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" type="submit">
            Submit Incident Report
          </button>
        </div>
      </form>
    </Modal>
  );
}
