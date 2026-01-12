// src/App.tsx
import { useState, useEffect } from 'react';
import { MapLayer } from './components/MapLayer';
import { ItineraryEditor } from './components/ItineraryEditor';
import { ItineraryPanel } from './components/ItineraryPanel';
import { syncToDataHub } from './config/firebase';

export default function App() {
  const [view, setView] = useState<'map' | 'editor'>('map');
  const [locations, setLocations] = useState<any[]>([]);
  // --- NEW: Track the specific Firestore Document ID for status updates ---
  const [currentDocId, setCurrentDocId] = useState<string | null>(null); 
  
  const [userProfile, setUserProfile] = useState({
    name: "Lakshay Nasa",
    subtitle: "Tech Explorer",
    avatar: ""
  });

  /**
   * handleDraftEmail - Capture the data in Firestore immediately when the 
   * influencer clicks "Draft Email". This triggers the 'ADDED' event 
   * for the Python watcher and sets the initial status as 'draft'.
   */
  const handleDraftEmail = async () => {
    try {
      // 1. Sync to Firestore and capture the returned Document ID
      const docId = await syncToDataHub(userProfile, locations);
      setCurrentDocId(docId); 
      
      console.log("✅ Firestore updated with Draft status. ID:", docId);
      
      // 2. Transition the view to the professional editor
      setView('editor'); 
    } catch (error) {
      console.error("Sync failed:", error);
      // Fallback: move to editor even if sync fails to maintain user flow
      setView('editor');
    }
  };
  
  // Custom Notification State (Toasts)
  const [notification, setNotification] = useState<{msg: string, type: 'warn' | 'success'} | null>(null);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleAddLocation = (loc: any) => {
    if (locations.length >= 5) {
      setNotification({ msg: "Maximum 5 locations allowed for this trip!", type: 'warn' });
      return; 
    }
    
    setLocations([...locations, loc]);
    setNotification({ msg: `Added ${loc.name} to itinerary`, type: 'success' });
  };

  const handleRemoveLocation = (index: number) => {
    const newLocs = [...locations];
    newLocs.splice(index, 1);
    setLocations(newLocs);
  };

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <div className="w-16 bg-black flex flex-col items-center py-4 space-y-4 z-50">
        <button 
          onClick={() => setView('map')} 
          className={`p-2 rounded transition-all ${view === 'map' ? 'bg-blue-600 scale-110' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          🗺️
        </button>
        <button 
          onClick={() => setView('editor')} 
          className={`p-2 rounded transition-all ${view === 'editor' ? 'bg-blue-600 scale-110' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          ✉️
        </button>
      </div>

      <div className="flex-1 relative">
        {view === 'map' ? (
          <>
            <MapLayer 
              onLocationSelect={handleAddLocation} 
              selectedLocations={locations}
            />
            <ItineraryPanel 
              locations={locations}
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              onRemoveLocation={handleRemoveLocation}
              // Triggers the initial Metadata Push
              onDraftEmail={handleDraftEmail}
            />
          </>
        ) : (
          <ItineraryEditor 
            selectedLocations={locations} 
            userProfile={userProfile} 
            // Pass the docId so the editor can finalize the status on export
            currentDocId={currentDocId} 
            onShowNotification={(msg: string, type: 'success' | 'warn') => setNotification({ msg, type })}
          />
        )}

        {/* Global Notification Toast */}
        {notification && (
          <div className={`absolute bottom-6 left-6 px-6 py-3 rounded-2xl shadow-2xl text-white font-bold transition-all transform animate-bounce z-[100] ${
            notification.type === 'warn' ? 'bg-red-500' : 'bg-green-500'
          }`}>
            {notification.type === 'warn' ? '⚠️ ' : '✅ '}
            {notification.msg}
          </div>
        )}
      </div>
    </div>
  );
}