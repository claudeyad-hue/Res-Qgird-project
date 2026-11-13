import React, { useState } from 'react';
import Drawer from '../common/Drawer';
import Badge from '../common/Badge';

export default function ResourceDrawer({ resource, isOpen, onClose, onAllocate, canAllocate = false }) {
  const [qty, setQty] = useState('');
  const [destination, setDestination] = useState('');
  const [priority, setPriority] = useState('medium');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  if (!resource) return <Drawer isOpen={isOpen} onClose={onClose} title="Resource" />;

  const handleAllocate = async (event) => {
    event.preventDefault();
    const amount = Number(qty);
    const nextErrors = {};
    if (!Number.isFinite(resource.amount)) nextErrors.qty = 'Current availability has not been reported.';
    else if (!Number.isFinite(amount) || amount <= 0) nextErrors.qty = 'Enter a positive quantity.';
    else if (amount > resource.amount) nextErrors.qty = `Only ${resource.amount.toLocaleString()} ${resource.unit || 'units'} are listed.`;
    if (!destination.trim()) nextErrors.destination = 'Enter a destination or receiving unit.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const success = await onAllocate(resource.id, amount, destination.trim(), priority);
      if (success) {
        setQty('');
        setDestination('');
        setPriority('medium');
        setErrors({});
      } else setErrors({ submit: 'Allocation was not recorded. Review the error message and try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={resource.type || resource.name || 'Resource'}
      actions={<><button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        {canAllocate && <button type="submit" form="resource-allocation-form" className="btn-primary" style={{ marginTop: 0 }} disabled={saving || resource.amount == null}>{saving ? 'Recording…' : 'Record allocation'}</button>}
      </>}
    >
      <div className="kv"><span>Resource ID</span><span>{resource.id}</span></div>
      <div className="kv"><span>Type</span><span>{resource.type || resource.name || 'Not reported'}</span></div>
      <div className="kv"><span>Status</span><span>{resource.status ? <Badge type="resource" status={resource.status} /> : 'Not reported'}</span></div>
      <div className="kv"><span>Available</span><span>{resource.amount == null ? 'Not reported' : `${resource.amount.toLocaleString()} ${resource.unit || ''}`}</span></div>
      <div className="kv"><span>Location</span><span>{resource.location || 'Not reported'}</span></div>

      {!canAllocate ? <p className="muted-copy">Your account does not have resource allocation permission.</p> : <form id="resource-allocation-form" onSubmit={handleAllocate} className="resource-allocation-form">
        <h4>Record an allocation</h4>
        <p className="muted-copy">This will reduce the listed available quantity and add a timestamped allocation record.</p>
        <div className="field">
          <label htmlFor="allocation-quantity">Quantity ({resource.unit || 'units'})</label>
          <input id="allocation-quantity" type="number" min="0.001" step="any" max={resource.amount ?? undefined} value={qty} onChange={(event) => { setQty(event.target.value); setErrors((previous) => ({ ...previous, qty: null, submit: null })); }} disabled={saving || resource.amount == null} />
          {errors.qty && <span className="field-error" role="alert">{errors.qty}</span>}
        </div>
        <div className="field">
          <label htmlFor="allocation-destination">Destination or receiving unit</label>
          <input id="allocation-destination" value={destination} maxLength={200} onChange={(event) => { setDestination(event.target.value); setErrors((previous) => ({ ...previous, destination: null, submit: null })); }} disabled={saving} />
          {errors.destination && <span className="field-error" role="alert">{errors.destination}</span>}
        </div>
        <div className="field">
          <label htmlFor="allocation-priority">Priority</label>
          <select id="allocation-priority" value={priority} onChange={(event) => setPriority(event.target.value)} disabled={saving}>
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
        </div>
        {errors.submit && <p className="form-error" role="alert">{errors.submit}</p>}
      </form>}
    </Drawer>
  );
}
