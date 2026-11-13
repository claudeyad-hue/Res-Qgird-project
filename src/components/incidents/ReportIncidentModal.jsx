import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import { validateCoordinates } from '../../utils/geoUtils';

export default function ReportIncidentModal({ isOpen, onClose, onSubmit }) {
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [affected, setAffected] = useState('');
  const [error, setError] = useState('');
  const typeInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setType('');
      setTitle('');
      setDescription('');
      setLocation('');
      setLatitude('');
      setLongitude('');
      setSeverity('medium');
      setAffected('');
      setError('');
      setTimeout(() => {
        typeInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!type.trim() || !title.trim() || !location.trim() || !description.trim() || latitude === '' || longitude === '') {
      setError('Enter the incident details and coordinates. Use Live Map to select a verified point.');
      return;
    }
    const lat = Number(latitude);
    const lng = Number(longitude);
    const coordinates = validateCoordinates({ latitude: lat, longitude: lng });
    if (!coordinates.insideArea) {
      setError(coordinates.error || 'Choose coordinates inside the Ghaziabad operational area.');
      return;
    }
    onSubmit({
      type,
      title: title.trim(),
      description: description.trim(),
      location,
      severity,
      affectedPeople: affected === '' ? null : Number(affected),
      latitude: lat,
      longitude: lng,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report incident">
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="rf-type">Type</label>
          <input
            id="rf-type"
            ref={typeInputRef}
            placeholder="e.g. Flood, Fire, Building Damage"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="rf-title">Incident title</label>
          <input id="rf-title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="rf-loc">Location</label>
          <input
            id="rf-loc"
            placeholder="e.g. Sector 9"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="rf-description">Description</label>
          <textarea id="rf-description" value={description} onChange={(e) => setDescription(e.target.value)} required maxLength={1000} />
        </div>
        <div className="field" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <label htmlFor="rf-lat">Latitude<input id="rf-lat" type="number" step="any" min="-90" max="90" value={latitude} onChange={(e) => setLatitude(e.target.value)} required /></label>
          <label htmlFor="rf-lng">Longitude<input id="rf-lng" type="number" step="any" min="-180" max="180" value={longitude} onChange={(e) => setLongitude(e.target.value)} required /></label>
        </div>
        <div className="field">
          <label htmlFor="rf-sev">Severity</label>
          <select
            id="rf-sev"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="rf-aff">People affected (est.)</label>
          <input
            id="rf-aff"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={affected}
            onChange={(e) => setAffected(e.target.value)}
            max="100000000"
          />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button
            className="btn-secondary"
            id="rf-cancel"
            type="button"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="btn-primary"
            id="rf-submit"
            type="submit"
          >
            Submit report
          </button>
        </div>
      </form>
    </Modal>
  );
}
