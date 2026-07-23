import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default icon paths (Vite/Webpack compatibility)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom blue customer marker
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
})

// Custom green worker marker
const workerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
})

/**
 * LocationPicker — internal component to capture map click for customer location.
 */
const LocationPicker = ({ onLocationSelect }) => {
  useMapEvents({
    click(e) {
      onLocationSelect?.(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

/**
 * Map — Phase 4 component.
 * Renders Leaflet map with:
 *   - Customer pin (blue, draggable)
 *   - Nearby worker pins (green) with popup info
 *   - Click to set customer location
 */
const Map = ({
  center = [12.9236, 80.1258],
  zoom = 13,
  customerLocation = null,
  workers = [],
  onLocationSelect = null,
  height = 350,
}) => {
  return (
    <div
      style={{
        height,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {onLocationSelect && <LocationPicker onLocationSelect={onLocationSelect} />}

        {/* Customer location marker */}
        {customerLocation && (
          <Marker position={[customerLocation.lat, customerLocation.lon]} icon={customerIcon}>
            <Popup>
              <strong>📍 Your Location</strong>
              <br />
              {customerLocation.label || 'Selected location'}
            </Popup>
          </Marker>
        )}

        {/* Worker markers */}
        {workers.map((worker, idx) =>
          worker.latitude && worker.longitude ? (
            <Marker
              key={worker.worker_id || worker.id || idx}
              position={[worker.latitude, worker.longitude]}
              icon={workerIcon}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>🔧 {worker.name}</strong>
                  <br />
                  ⭐ {worker.average_rating?.toFixed(1)} &nbsp;|&nbsp; {worker.experience_years}y exp
                  <br />
                  📏 {worker.distance_km?.toFixed(1)} km away
                  <br />
                  💰 ₹{worker.hourly_rate}/hr
                  <br />
                  <span style={{ color: worker.is_available ? 'green' : 'red' }}>
                    {worker.is_available ? '✅ Available' : '❌ Busy'}
                  </span>
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>
    </div>
  )
}

export default Map
