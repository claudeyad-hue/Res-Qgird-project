import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';
import SituationBar from '../components/dashboard/SituationBar';
import StatCard from '../components/common/StatCard';
import ResourceUtilization from '../components/dashboard/ResourceUtilization';
import RecentActivity from '../components/dashboard/RecentActivity';
import MapCanvas from '../components/map/MapCanvas';
import MapLegend from '../components/map/MapLegend';
import Drawer from '../components/common/Drawer';
import IncidentDrawerContent, { IncidentDrawerActions } from '../components/incidents/IncidentDrawerContent';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    user, incidents, hospitals, resources, hospitalStats, teams, lastUpdated, isInitialLoading,
    criticalCount, drawer, openDrawer, closeDrawer,
    assignTeam, updateIncidentStatus,
  } = useApp();

  const activeIncidents = incidents.filter(i => String(i.status).toLowerCase() !== 'resolved');
  const recentIncidents = activeIncidents.slice(0, 4);
  const selectedIncident = drawer.type === 'incident' ? incidents.find(i => i.id === drawer.id) : null;

  const affectedCounts = incidents.map((incident) => incident.affectedPeople ?? incident.affected).filter((value) => Number.isFinite(Number(value)) && value !== null && value !== '');
  const totalAffected = affectedCounts.length ? affectedCounts.reduce((sum, value) => sum + Number(value), 0) : null;
  const rescueTeams = teams.filter((team) => ['deployed', 'assigned'].includes(String(team.status || team.availability || '').toLowerCase())).length;

  return (
    <>
      <Header
        title={`Good morning, ${user?.name?.trim().split(/\s+/)[0] || 'Operations'}`}
        subtitle="Monitor emergency operations and coordinate response teams."
      />
      <div className="screen-body">
        <SituationBar
          situation={`${criticalCount} critical incident${criticalCount !== 1 ? 's' : ''} and ${activeIncidents.length} active incident${activeIncidents.length !== 1 ? 's' : ''}.`}
          updated={lastUpdated ? `Last refreshed ${lastUpdated}` : 'Awaiting data refresh'}
        />

        {/* Stats Row */}
        <div className="stat-grid">
          <StatCard value={activeIncidents.length} label="Active incidents" />
          <StatCard value={criticalCount} label="Critical incidents" />
          <StatCard value={totalAffected === null ? '—' : totalAffected.toLocaleString()} label="People reported affected" />
          <StatCard value={hospitalStats.total} label="Hospital source listings" />
          <StatCard value={rescueTeams} label="Units assigned / deployed" />
        </div>

        {/* Map + Active Incidents */}
        <div className="dash-main">
          <div className="panel">
            <div className="panel-head">
              <h3>Incident map</h3>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <MapLegend />
                <button className="link-btn" onClick={() => navigate('/map')}>Full map →</button>
              </div>
            </div>
            <MapCanvas variant="mini" markerSize={14} />
          </div>

          <div className="panel">
            <div className="panel-head">
              <h3>Active incidents</h3>
              <button className="link-btn" onClick={() => navigate('/incidents')}>View all →</button>
            </div>
            {isInitialLoading ? (
              <div className="empty-state" role="status">Loading incident records…</div>
            ) : recentIncidents.length === 0 ? (
              <div className="empty-state"><div className="glyph">✓</div>No active incidents.</div>
            ) : (
              recentIncidents.map(inc => (
                <div
                  key={inc.id}
                  className={`incident-row sev-${String(inc.severity).toLowerCase()}`}
                  onClick={() => openDrawer('incident', inc.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter') openDrawer('incident', inc.id); }}
                >
                  <span className="sev-dot" />
                  <div className="body">
                    <div className="type">{inc.title || inc.type}</div>
                    <div className="meta">{inc.id} · {inc.address || inc.location}</div>
                    <div className="status">{inc.team || inc.assignedTeamId ? `Team: ${inc.team || inc.assignedTeamId}` : 'Unassigned'}</div>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--ink-muted)', flexShrink: 0 }}>
                    {inc.time || (inc.reportedAt ? new Date(inc.reportedAt).toLocaleTimeString() : 'Recently')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Lower row */}
        <div className="quiet-grid">
          <ResourceUtilization resources={resources} />
          <RecentActivity incidents={incidents} />
        </div>

        {/* Hospital quick stats */}
        <div style={{ marginTop: 'var(--card-gap)' }}>
          <div className="panel">
            <div className="panel-head">
              <h3>Hospital directory</h3>
              <button className="link-btn" onClick={() => navigate('/hospitals')}>View all →</button>
            </div>
            <div className="stat-grid stat-grid-3" style={{ padding: 'var(--card-pad)', margin: 0, border: 'none' }}>
              <StatCard value={hospitalStats.total} label="Facilities listed" />
              <StatCard value={hospitalStats.mapped} label="Mapped locations" />
              <StatCard value="Not connected" label="Live availability" />
            </div>
            {hospitals.slice(0, 4).map(h => (
              <button
                key={h.id}
                type="button"
                className="list-row"
                onClick={() => navigate('/hospitals')}
              >
                <span>{h.name}</span>
                <span style={{ fontSize: '13px', color: 'var(--ink-muted)' }}>
                  {h.category} · {h.verificationStatus?.replaceAll('-', ' ') || 'unverified'}
                </span>
                <span className="chev">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Incident Drawer */}
      <Drawer
        isOpen={drawer.isOpen && drawer.type === 'incident'}
        onClose={closeDrawer}
        title={selectedIncident ? `${selectedIncident.type} — ${selectedIncident.id}` : 'Incident'}
        actions={
          <IncidentDrawerActions
            incident={selectedIncident}
            onAssignTeam={assignTeam}
            onUpdateStatus={updateIncidentStatus}
          />
        }
      >
        <IncidentDrawerContent incident={selectedIncident} />
      </Drawer>
    </>
  );
}
