import React, { useState } from 'react';

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'Critical', label: 'Critical' },
  { id: 'Fire', label: 'Fire' },
  { id: 'Flood', label: 'Flood' },
  { id: 'Road Accident', label: 'Accident' },
  { id: 'Medical Emergency', label: 'Medical' },
  { id: 'Earthquake', label: 'Earthquake' },
  { id: 'Landslide', label: 'Landslide' },
  { id: 'Building Collapse', label: 'Building Collapse' },
  { id: 'Resolved', label: 'Resolved' },
];

export default function IncidentMapFilters({
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
  severityFilter,
  onSeverityFilterChange,
  statusFilter,
  onStatusFilterChange,
  timeRangeFilter,
  onTimeRangeFilterChange,
  onReportClick,
  onResetFilters,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px var(--space-page)',
        borderBottom: '1px solid var(--line)',
        background: 'var(--surface)',
      }}
    >
      {/* Top Search & Primary Filters Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
          <input
            className="search-input"
            style={{ width: '260px' }}
            placeholder="Search by ID, title, type, or address…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search incidents"
          />

          {/* Quick Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {TYPE_FILTERS.slice(0, 5).map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => onFilterChange(f.id)}
              >
                {f.label}
              </button>
            ))}

            <button
              type="button"
              className="btn-secondary"
              style={{ height: '36px', padding: '0 12px', fontSize: '12.5px' }}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▲ Less Filters' : '▼ More Filters'}
            </button>

            {(searchQuery || activeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || timeRangeFilter !== 'all') && (
              <button
                type="button"
                className="link-btn"
                style={{ fontSize: '12.5px', marginLeft: '6px' }}
                onClick={onResetFilters}
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Action: + Report Incident */}
        {onReportClick && (
          <button
            type="button"
            className="btn-report"
            style={{ height: '42px', padding: '0 18px', fontWeight: 600 }}
            onClick={onReportClick}
          >
            + Report Incident
          </button>
        )}
      </div>

      {/* Extended Filter Panel */}
      {showAdvanced && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
            paddingTop: '10px',
            borderTop: '1px dashed var(--line)',
          }}
        >
          {/* Secondary Type Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {TYPE_FILTERS.slice(5).map((f) => (
              <button
                key={f.id}
                type="button"
                className={`chip ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => onFilterChange(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Severity Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => onSeverityFilterChange(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '12.5px',
              }}
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '12.5px',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Verified">Verified</option>
              <option value="Assigned">Assigned</option>
              <option value="Rescue Dispatched">Rescue Dispatched</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          {/* Time Range Dropdown (Section J) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>Time:</span>
            <select
              value={timeRangeFilter}
              onChange={(e) => onTimeRangeFilterChange(e.target.value)}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                color: 'var(--ink)',
                fontSize: '12.5px',
              }}
            >
              <option value="all">All Time</option>
              <option value="1h">Last hour</option>
              <option value="6h">Last 6 hours</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
