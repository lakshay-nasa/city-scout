// src/components/MapLayer.tsx
import { useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';

const BENGALURU_CENTER = { lat: 12.9716, lng: 77.5946 };

// Component 1: Handle camera movements
const MapUpdater = ({ hoveredLocation }: { hoveredLocation: { lat: number, lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (map && hoveredLocation) {
      map.panTo(hoveredLocation);
      map.setZoom(18);
      map.setTilt(67.5); 
    }
  }, [map, hoveredLocation]);
  return null;
};

// Component 2: The actual map logic (Nested child)
const MapContent = ({ onLocationSelect, selectedLocations, hoveredLocation }: any) => {
  const map = useMap();

  const handleMapClick = async (ev: any) => {
    // 1. LANDMARK CLICK (New Places API)
    if (ev.detail.placeId && map) {
      ev.stop(); 
      
      try {
        // @ts-ignore
        const place = new google.maps.places.Place({
          id: ev.detail.placeId,
        });

        // Fetch displayName, location, photos, AND the ID
        await place.fetchFields({
          fields: ['displayName', 'location', 'photos', 'id'],
        });

        const photoUrl = place.photos && place.photos.length > 0
            ? place.photos[0].getURI({ maxWidth: 400 })
            : "https://images.unsplash.com/photo-1500835595333-5b4737526b3c?w=400&q=80";

        onLocationSelect({
          // CRITICAL CHANGE: Save the placeId
          placeId: place.id, 
          name: place.displayName || "Unknown Landmark",
          lat: place.location?.lat(),
          lng: place.location?.lng(),
          photo: photoUrl
        });

      } catch (error) {
        console.error("Failed to fetch place details:", error);
      }
    } 
    // 2. EMPTY SPOT CLICK
    else if (ev.detail.latLng) {
      onLocationSelect({
        // No placeId for arbitrary drops
        placeId: null, 
        name: `Dropped Pin`,
        lat: ev.detail.latLng.lat,
        lng: ev.detail.latLng.lng,
        photo: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?w=400&q=80"
      });
    }
  };

  return (
    <>
      <Map
        defaultCenter={BENGALURU_CENTER}
        defaultZoom={15}
        mapId="100ae869d398e82a2c2dbfb1"
        renderingType="VECTOR"
        onClick={handleMapClick} 
        disableDefaultUI={true}
        gestureHandling={'greedy'}
        style={{ width: '100%', height: '100%' }}
      >
        {selectedLocations.map((loc: any, index: number) => (
          <AdvancedMarker 
            key={`${loc.lat}-${loc.lng}-${index}`} 
            position={{ lat: loc.lat, lng: loc.lng }}
          >
            <Pin background={'#3b82f6'} glyphColor={'white'} borderColor={'#1d4ed8'} />
          </AdvancedMarker>
        ))}
        <MapUpdater hoveredLocation={hoveredLocation || null} />
      </Map>
    </>
  );
};

// Component 3: Main Wrapper
export const MapLayer = (props: any) => {
  return (
    <div className="h-full w-full">
      <APIProvider 
        apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY} 
        libraries={['places']}
      >
        <MapContent {...props} />
      </APIProvider>
    </div>
  );
};