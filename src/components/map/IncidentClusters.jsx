import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMap, Marker, Popup } from 'react-leaflet';
import Supercluster from 'supercluster';
import { createIncidentIcon, createClusterIcon } from './mapIcons';
import IncidentPopup from './IncidentPopup';

export default function IncidentClusters({
  incidents,
  userLocation,
  onOpenDrawer,
  onAssignTeam,
  onUpdateStatus,
  userRole,
  onSelectForRouting,
  activeRoutingIncidentId,
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => Math.round(map.getZoom()));
  const [bounds, setBounds] = useState(() => map.getBounds());

  // Update bounds and zoom when map moves or zooms
  const updateMapState = useCallback(() => {
    setZoom(Math.round(map.getZoom()));
    setBounds(map.getBounds());
  }, [map]);

  useEffect(() => {
    map.on('moveend', updateMapState);
    map.on('zoomend', updateMapState);
    return () => {
      map.off('moveend', updateMapState);
      map.off('zoomend', updateMapState);
    };
  }, [map, updateMapState]);

  // Initialize Supercluster instance
  const superclusterIndex = useMemo(() => {
    const sc = new Supercluster({
      radius: 50,
      maxZoom: 16,
      map: (props) => ({
        hasCritical: String(props.severity).toLowerCase() === 'critical' ? 1 : 0,
      }),
      reduce: (accumulated, props) => {
        accumulated.hasCritical += props.hasCritical;
      },
    });

    const points = incidents
      .filter((i) => typeof i.latitude === 'number' && typeof i.longitude === 'number')
      .map((inc) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [inc.longitude, inc.latitude],
        },
        properties: inc,
      }));

    sc.load(points);
    return sc;
  }, [incidents]);

  // Compute visible clusters / points within current bbox & zoom
  const clusters = useMemo(() => {
    if (!bounds || !superclusterIndex) return [];
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    try {
      return superclusterIndex.getClusters(bbox, zoom);
    } catch {
      return [];
    }
  }, [superclusterIndex, bounds, zoom]);

  const handleClusterClick = (clusterId, coords) => {
    try {
      const expansionZoom = Math.min(
        superclusterIndex.getClusterExpansionZoom(clusterId),
        16
      );
      map.flyTo([coords[1], coords[0]], expansionZoom, { duration: 0.6 });
    } catch {
      map.flyTo([coords[1], coords[0]], zoom + 2);
    }
  };

  return (
    <>
      {clusters.map((feature) => {
        const [lng, lat] = feature.geometry.coordinates;
        const isCluster = feature.properties.cluster;

        if (isCluster) {
          const { cluster_id, point_count, hasCritical } = feature.properties;
          const clusterIcon = createClusterIcon(point_count, hasCritical > 0);

          return (
            <Marker
              key={`cluster-${cluster_id}`}
              position={[lat, lng]}
              icon={clusterIcon}
              eventHandlers={{
                click: () => handleClusterClick(cluster_id, [lng, lat]),
              }}
            />
          );
        }

        const incident = feature.properties;
        const icon = createIncidentIcon(incident.type, incident.severity);

        return (
          <Marker
            key={`incident-${incident.id}`}
            position={[lat, lng]}
            icon={icon}
          >
            <Popup>
              <IncidentPopup
                incident={incident}
                userLocation={userLocation}
                onOpenDrawer={onOpenDrawer}
                onAssignTeam={onAssignTeam}
                onUpdateStatus={onUpdateStatus}
                userRole={userRole}
                onSelectForRouting={onSelectForRouting}
                activeRoutingIncidentId={activeRoutingIncidentId}
              />
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
