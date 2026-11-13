import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';
import ResourceTable from '../components/resources/ResourceTable';
import ResourceDrawer from '../components/resources/ResourceDrawer';
import StatCard from '../components/common/StatCard';

const CAN_ALLOCATE_ROLES = new Set(['admin', 'operator', 'medical']);

export default function Resources() {
  const { resources, dataSources, isInitialLoading, user, drawer, openDrawer, closeDrawer, allocateResource } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const selectedResource = drawer.type === 'resource' ? resources.find((resource) => resource.id === drawer.id) : null;
  const canAllocate = CAN_ALLOCATE_ROLES.has(String(user?.role || '').toLowerCase());
  const filteredResources = useMemo(() => resources.filter((resource) => {
    const query = search.trim().toLowerCase();
    const text = `${resource.id || ''} ${resource.name || ''} ${resource.type || ''} ${resource.location || ''}`.toLowerCase();
    return (!query || text.includes(query)) && (statusFilter === 'all' || String(resource.status || '').toLowerCase() === statusFilter);
  }), [resources, search, statusFilter]);
  const listedAvailable = resources.filter((resource) => String(resource.status || '').toLowerCase() === 'available').length;
  const listedLow = resources.filter((resource) => String(resource.status || '').toLowerCase() === 'low').length;
  const haveRecords = resources.length > 0;

  return (
    <>
      <Header title="Emergency resources" subtitle="Review listed stock and record authorized allocations." />
      <div className="screen-body">
        {dataSources.resources !== 'API' && <div className="data-source-notice" role="note">
          Resource records are not connected to a verified live inventory feed. {dataSources.resources === 'demo scenario' ? 'Current rows are demonstration data.' : 'Availability is not reported.'}
        </div>}
        <div className="stat-grid stat-grid-3" style={{ marginBottom: 'var(--space-section)' }}>
          <StatCard value={haveRecords ? resources.length : '—'} label="Listed resource records" />
          <StatCard value={haveRecords ? listedAvailable : '—'} label="Listed as available" />
          <StatCard value={haveRecords ? listedLow : '—'} label="Listed as low stock" />
        </div>
        <div className="resource-filters" aria-label="Resource filters">
          <label htmlFor="resource-search">Search resources<input id="resource-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, type, location" /></label>
          <label htmlFor="resource-status">Listed status<select id="resource-status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="available">Available</option><option value="low">Low</option><option value="allocated">Allocated</option><option value="in-transit">In transit</option><option value="depleted">Depleted</option></select></label>
        </div>
        {isInitialLoading ? <div className="empty-state" role="status">Loading resource records…</div> : <ResourceTable resources={filteredResources} canAllocate={canAllocate} onSelectResource={(id) => openDrawer('resource', id)} />}
      </div>
      <ResourceDrawer resource={selectedResource} isOpen={drawer.isOpen && drawer.type === 'resource'} onClose={closeDrawer} onAllocate={allocateResource} canAllocate={canAllocate} />
    </>
  );
}
