import React from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/layout/Header';
import ResourceTable from '../components/resources/ResourceTable';
import ResourceDrawer from '../components/resources/ResourceDrawer';
import StatCard from '../components/common/StatCard';
import { RESOURCE_AVAILABILITY } from '../data/initialData';

export default function Resources() {
  const {
    resources,
    drawer, openDrawer, closeDrawer,
    allocateResource,
  } = useApp();

  const selectedResource = drawer.type === 'resource'
    ? resources.find(r => r.id === drawer.id)
    : null;

  const totalAvailable = resources.filter(r => r.status === 'available').length;
  const lowCount = resources.filter(r => r.status === 'low').length;

  return (
    <>
      <Header
        title="Emergency Resources"
        subtitle="Monitor and allocate critical resources."
      />
      <div className="screen-body">
        {/* Quick stats */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 'var(--space-section)' }}>
          <StatCard value={resources.length} label="Resource types" />
          <StatCard value={totalAvailable} label="Fully available" />
          <StatCard value={lowCount} label="Low stock" />
        </div>

        {/* Resource utilization bars */}
        <div className="panel" style={{ marginBottom: 'var(--space-section)' }}>
          <div className="panel-head"><h3>Availability overview</h3></div>
          <div style={{ padding: 'var(--card-pad)' }}>
            {RESOURCE_AVAILABILITY.map((item, i) => (
              <div key={i} className="bar-row">
                <span>{item.label}</span>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${item.percent}%`,
                      background: item.percent < 30 ? 'var(--critical)' : item.percent < 50 ? 'var(--high)' : undefined,
                    }}
                  />
                </div>
                <span>{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>

        <ResourceTable
          resources={resources}
          onSelectResource={id => openDrawer('resource', id)}
        />
      </div>

      {/* Resource Allocation Drawer */}
      <ResourceDrawer
        resource={selectedResource}
        isOpen={drawer.isOpen && drawer.type === 'resource'}
        onClose={closeDrawer}
        onAllocate={allocateResource}
      />
    </>
  );
}
