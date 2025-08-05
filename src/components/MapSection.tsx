import React, { useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { MapPin, Map, Satellite } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// NOTE: In a production app, this key should be stored in an environment variable.
const MAPTILER_API_KEY = 'aTChQEvBqKVcP0AXd2bH';

interface MapSectionProps {
  address: string;
  coordinates?: { lat: number; lng: number };
  onLocationSelect: (lat: number, lng: number) => void;
  onAddressGeocode: (address: string) => Promise<{ lat: number; lng: number } | null>;
}

interface MapEventHandlerProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

const MapEventHandler: React.FC<MapEventHandlerProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationSelect(lat, lng);
    },
  });
  return null;
};

const MapSection: React.FC<MapSectionProps> = ({
  address,
  coordinates,
  onLocationSelect,
  onAddressGeocode
}) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isLoading, setIsLoading] = useState(false);
  const mapRef = useRef<LeafletMap>(null);

  // Default center (San Francisco Bay Area - good for solar projects)
  const defaultCenter: [number, number] = [37.7749, -122.4194];
  const mapCenter: [number, number] = coordinates 
    ? [coordinates.lat, coordinates.lng] 
    : defaultCenter;

  const handleCenterOnAddress = async () => {
    if (!address.trim()) return;
    
    setIsLoading(true);
    try {
      const location = await onAddressGeocode(address);
      if (location && mapRef.current) {
        mapRef.current.setView([location.lat, location.lng], 16);
        onLocationSelect(location.lat, location.lng);
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTileLayerUrl = () => {
    const style = mapType === 'satellite' ? 'satellite' : 'streets-v2';
    const format = mapType === 'satellite' ? 'jpg' : 'png';
    return `https://api.maptiler.com/maps/${style}/{z}/{x}/{y}.${format}?key=${MAPTILER_API_KEY}`;
  };

  const getTileLayerAttribution = () => {
    return '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-orange-500" />
            Project Location
          </h3>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMapType('streets')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                mapType === 'streets'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4 mr-1" />
              Map
            </button>
            <button
              onClick={() => setMapType('satellite')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center ${
                mapType === 'satellite'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Satellite className="w-4 h-4 mr-1" />
              Satellite
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          Click on the map to select your project location or use the button below to center on the address.
        </div>
        
        <button
          onClick={handleCenterOnAddress}
          disabled={!address.trim() || isLoading}
          className="w-full sm:w-auto px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 
                     disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {isLoading ? 'Locating...' : 'Center Map on Address'}
        </button>
      </div>

      <div className="relative">
        <div className="h-80 sm:h-96 relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={coordinates ? 16 : 10}
            className="h-full w-full rounded-b-lg"
            ref={mapRef}
          >
            <TileLayer
              url={getTileLayerUrl()}
              attribution={getTileLayerAttribution()}
              key={mapType} // Re-renders the layer when map type changes
            />
            <MapEventHandler onLocationSelect={onLocationSelect} />
            {coordinates && (
              <Marker position={[coordinates.lat, coordinates.lng]} />
            )}
          </MapContainer>
        </div>
        
        {coordinates && (
          <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm text-xs">
            <div className="font-medium text-gray-800">Selected Location:</div>
            <div className="text-gray-600">
              {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
            </div>
          </div>
        )}
        
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs text-gray-600">
          Map powered by MapTiler
        </div>
      </div>
    </div>
  );
};

export default MapSection;