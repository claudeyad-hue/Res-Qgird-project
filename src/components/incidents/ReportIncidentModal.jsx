import React, { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';

export default function ReportIncidentModal({ isOpen, onClose, onSubmit }) {
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [affected, setAffected] = useState('');
  const typeInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setType('');
      setLocation('');
      setSeverity('medium');
      setAffected('');
      setTimeout(() => {
        typeInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      type,
      location,
      severity,
      affected,
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
          <label htmlFor="rf-loc">Location</label>
          <input
            id="rf-loc"
            placeholder="e.g. Sector 9"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
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
          />
        </div>
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
