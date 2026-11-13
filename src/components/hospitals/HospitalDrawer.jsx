import React, { useState } from 'react';
import Drawer from '../common/Drawer';

function display(value) { return value === null || value === undefined || value === '' ? 'Not published' : value; }

export default function HospitalDrawer({ hospital, isOpen, onClose, onTransfer, alreadyRequested, canRequestTransfer = false, canUpdateAvailability = false, onUpdateAvailability }) {
  const [availability, setAvailability] = useState({ beds: '', icuBeds: '', oxygen: '', ambulances: '', emergencyStatus: '', source: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!hospital) return <Drawer isOpen={isOpen} onClose={onClose} title="Hospital" />;

  const coordinatesAvailable = Number.isFinite(hospital.latitude) && Number.isFinite(hospital.longitude);
  const directionsUrl = coordinatesAvailable
    ? `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`
    : null;
  const verificationDate = hospital.lastVerifiedAt ? new Date(hospital.lastVerifiedAt).toLocaleString() : 'Not currently verified';
  const sourceCheckedDate = hospital.sourceCheckedAt ? new Date(hospital.sourceCheckedAt).toLocaleString() : 'Not recorded';
  const live = hospital.liveAvailability;

  const submitAvailability = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onUpdateAvailability?.(hospital.id, availability);
      setAvailability({ beds: '', icuBeds: '', oxygen: '', ambulances: '', emergencyStatus: '', source: '' });
    } catch (updateError) {
      setError(updateError.message || 'Availability could not be updated.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={hospital.name || 'Hospital Details'}
      actions={<><button type="button" className="btn-ghost" onClick={onClose}>Close</button>
        <button type="button" className="btn-primary" style={{ marginTop: 0 }} disabled={!canRequestTransfer || alreadyRequested} onClick={() => onTransfer?.(hospital.id)}>{alreadyRequested ? 'Requested ✓' : canRequestTransfer ? 'Request transfer' : 'Transfers unavailable in preview'}</button></>}>
      <div className="hospital-drawer-details">
        <div className="kv"><span>Facility ID</span><span>{hospital.id}</span></div>
        <div className="kv"><span>Facility type</span><span>{display(hospital.category)}</span></div>
        <div className="kv"><span>Ownership</span><span>{hospital.ownership === 'government' ? 'Government' : hospital.ownership === 'private' ? 'Private' : 'Not stated by source'}</span></div>
        <div className="kv"><span>Address</span><span>{hospital.address || 'Address not published'}</span></div>
        <div className="kv"><span>Contact</span><span>{hospital.contact ? <a href={`tel:${hospital.contact}`}>{hospital.contact}</a> : 'Not published'}</span></div>
        {coordinatesAvailable && <div className="kv"><span>Coordinates</span><span>{hospital.latitude.toFixed(6)}, {hospital.longitude.toFixed(6)}</span></div>}
        {directionsUrl && <a className="btn-secondary hospital-directions" href={directionsUrl} target="_blank" rel="noreferrer">Directions in Google Maps ↗</a>}

        <h4>Operational availability</h4>
        {live?.updatedAt ? <>
          <div className="kv"><span>Emergency status (self-reported)</span><span>{display(live.emergencyStatus)}</span></div>
          <div className="kv"><span>Beds / ICU / oxygen / ambulances</span><span>{display(live.beds)} / {display(live.icuBeds)} / {display(live.oxygen)} / {display(live.ambulances)}</span></div>
          <div className="kv"><span>Updated at</span><span>{new Date(live.updatedAt).toLocaleString()}</span></div>
          <div className="kv"><span>Update source</span><span>{display(live.source)}</span></div>
        </> : <p className="hospital-availability-unavailable">Live availability not connected</p>}
        {hospital.emergencyServiceListed === true && <p>Emergency room service is listed in the cited source. Current emergency acceptance is not confirmed.</p>}

        <h4>Verification and sources</h4>
        <div className="kv"><span>Verification status</span><span>{display(hospital.verificationStatus)}</span></div>
        <div className="kv"><span>Last verified</span><span>{verificationDate}</span></div>
        <div className="kv"><span>Source checked</span><span>{sourceCheckedDate}</span></div>
        <div className="hospital-source-links">{(hospital.sources || (hospital.sourceUrl ? [hospital.sourceUrl] : [])).map((url) => <a key={url} href={url} target="_blank" rel="noreferrer">Official source ↗</a>)}</div>
        {hospital.verificationStatus !== 'district-directory-listed' && <p className="hospital-availability-unavailable">This is an official directory or source snapshot listing and needs a current operational re-check.</p>}

        {canUpdateAvailability && <form className="hospital-admin-update" onSubmit={submitAvailability}>
          <h4>Update this facility’s reported availability</h4>
          <p>Updates are timestamped and attributed to the authenticated hospital administrator.</p>
          <div className="hospital-admin-fields">
            {['beds', 'icuBeds', 'oxygen', 'ambulances'].map((field) => <label key={field}>{({ beds: 'Available beds', icuBeds: 'Available ICU beds', oxygen: 'Oxygen units', ambulances: 'Ambulances' })[field]}<input type="number" min="0" value={availability[field]} onChange={(event) => setAvailability((state) => ({ ...state, [field]: event.target.value }))} /></label>)}
            <label>Emergency status<select value={availability.emergencyStatus} onChange={(event) => setAvailability((state) => ({ ...state, emergencyStatus: event.target.value }))}><option value="">Not reported</option><option value="accepting">Accepting</option><option value="limited">Limited</option><option value="full">Full</option><option value="diverting">Diverting</option></select></label>
            <label>Update source<input required maxLength="300" value={availability.source} onChange={(event) => setAvailability((state) => ({ ...state, source: event.target.value }))} placeholder="Facility operations report" /></label>
          </div>
          {error && <p role="alert">{error}</p>}
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Submit verified update'}</button>
        </form>}
      </div>
    </Drawer>
  );
}
