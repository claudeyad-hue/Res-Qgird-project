import React from 'react';
import DisasterMap from './DisasterMap';

/**
 * MapCanvas adapter component
 * Retains existing props and forwards to the real interactive DisasterMap
 */
export default function MapCanvas({
  variant = 'full', // 'mini' | 'full'
  searchQuery = '',
  activeFilter = 'all',
  severityFilter = 'all',
  statusFilter = 'all',
  timeRangeFilter = 'all',
  onPickLocation = null,
  isPickingLocation = false,
}) {
  return (
    <DisasterMap
      variant={variant}
      searchQuery={searchQuery}
      activeFilter={activeFilter}
      severityFilter={severityFilter}
      statusFilter={statusFilter}
      timeRangeFilter={timeRangeFilter}
      onPickLocation={onPickLocation}
      isPickingLocation={isPickingLocation}
    />
  );
}
