import { useMapEvents } from 'react-leaflet';

export default function MapClickHandler({ onMapClick, isPickingLocation = false }) {
  useMapEvents({
    click(e) {
      if (onMapClick && isPickingLocation) {
        onMapClick({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng,
        });
      }
    },
  });

  return null;
}
