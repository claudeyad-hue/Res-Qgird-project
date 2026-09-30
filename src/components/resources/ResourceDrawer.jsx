import React, { useState } from 'react';
import Drawer from '../common/Drawer';
import Badge from '../common/Badge';

export default function ResourceDrawer({ resource, isOpen, onClose, onAllocate }) {
  const [qty, setQty] = useState('');
  const [dest, setDest] = useState('');
  const [priority, setPriority] = useState('medium');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    const q = parseInt(qty, 10);
    if (!qty || isNaN(q) || q <= 0) e.qty = 'Enter a valid quantity.';
    else if (q > (resource?.amount ?? 0)) e.qty = `Only ${resource.amount.toLocaleString()} ${resource.unit} available.`;
    if (!dest.trim()) e.dest = 'Enter a destination.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAllocate = () => {
    if (!validate()) return;
    onAllocate(resource.id, parseInt(qty, 10), dest.trim(), priority);
    setQty('');
    setDest('');
    setPriority('medium');
    setErrors({});
  };

  if (!resource) return <Drawer isOpen={isOpen} onClose={onClose} title="Resource" />;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={resource.type}
      actions={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn-primary" style={{ marginTop: 0 }} onClick={handleAllocate}>
            Allocate
          </button>
        </>
      }
    >
      <div className="kv"><span>Resource ID</span><span>{resource.id}</span></div>
      <div className="kv"><span>Type</span><span>{resource.type}</span></div>
      <div className="kv">
        <span>Status</span>
        <span><Badge type="resource" status={resource.status} /></span>
      </div>
      <div className="kv">
        <span>Available</span>
        <span>{resource.amount.toLocaleString()} {resource.unit}</span>
      </div>
      <div className="kv"><span>Location</span><span>{resource.location}</span></div>

      <div style={{ marginTop: '24px' }}>
        <p style={{ fontWeight: 600, marginBottom: '14px', fontSize: '14px' }}>Allocate Resources</p>

        <div className="field">
          <label>Quantity ({resource.unit})</label>
          <input
            type="number"
            min="1"
            max={resource.amount}
            placeholder={`Max ${resource.amount.toLocaleString()}`}
            value={qty}
            onChange={e => { setQty(e.target.value); setErrors(p => ({ ...p, qty: null })); }}
          />
          {errors.qty && <span style={{ color: 'var(--critical)', fontSize: '12px' }}>{errors.qty}</span>}
        </div>

        <div className="field">
          <label>Destination / Team</label>
          <input
            placeholder="e.g. Rescue Team Alpha, Shelter B"
            value={dest}
            onChange={e => { setDest(e.target.value); setErrors(p => ({ ...p, dest: null })); }}
          />
          {errors.dest && <span style={{ color: 'var(--critical)', fontSize: '12px' }}>{errors.dest}</span>}
        </div>

        <div className="field">
          <label>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
    </Drawer>
  );
}
