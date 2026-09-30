import React from 'react';

const FILTER_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'resolved', label: 'Resolved' },
];

export default function IncidentFilters({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  onReportClick,
}) {
  return (
    <div className="filter-bar">
      <input
        className="search-input"
        style={{ width: '220px' }}
        placeholder="Search incidents"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search incidents"
      />
      {FILTER_OPTIONS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`chip ${activeFilter === filter.id ? 'active' : ''}`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </button>
      ))}
      <button
        type="button"
        className="btn-report"
        onClick={onReportClick}
      >
        + Report Incident
      </button>
    </div>
  );
}
