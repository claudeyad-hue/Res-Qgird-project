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
    <div className="map-filter-panel">
      {/* Top Search & Primary Filters Row */}
      <div className="map-filter-row">
        <div className="map-filter-controls">
          <input
            className="search-input map-filter-search"
            placeholder="Search by ID, title, type, or address…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search incidents"
          />

          {/* Quick Filter Chips */}
          <div className="map-filter-chips">
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
              className="btn-secondary map-filter-more"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '▲ Less Filters' : '▼ More Filters'}
            </button>

            {(searchQuery || activeFilter !== 'all' || severityFilter !== 'all' || statusFilter !== 'all' || timeRangeFilter !== 'all') && (
              <button
                type="button"
                className="link-btn map-filter-clear"
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
            className="btn-report map-filter-report"
            onClick={onReportClick}
          >
            + Report Incident
          </button>
        )}
      </div>

      {/* Extended Filter Panel */}
      {showAdvanced && (
        <div className="map-filter-advanced">
          {/* Secondary Type Chips */}
          <div className="map-filter-extra-chips">
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
          <div className="map-filter-field">
            <span>Severity:</span>
            <select
              className="map-filter-select"
              value={severityFilter}
              onChange={(e) => onSeverityFilterChange(e.target.value)}
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="map-filter-field">
            <span>Status:</span>
            <select
              className="map-filter-select"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
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
          <div className="map-filter-field">
            <span>Time:</span>
            <select
              className="map-filter-select"
              value={timeRangeFilter}
              onChange={(e) => onTimeRangeFilterChange(e.target.value)}
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
