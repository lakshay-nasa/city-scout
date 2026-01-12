// src/components/ItineraryPanel.tsx
import { useState, useEffect } from 'react';

const QUOTES = [
  "Not all those who wander are lost.",
  "Adventure is worthwhile.",
  "Travel is the only thing you buy that makes you richer.",
  "Collect moments, not things.",
  "Jobs fill your pockets, adventures fill your soul.",
  "Life begins at the end of your comfort zone.",
  "Say yes to new adventures.",
  "Travel far enough, you meet yourself.",
  "Take only memories, leave only footprints.",
  "Wander often, wonder always.",
  "Go where you feel most alive.",
  "Fill your life with experiences, not things.",
  "Once a year, go somewhere you’ve never been before.",
  "Escape the ordinary.",
  "Dare to live the life you’ve always wanted.",
  "Adventure may hurt you, but monotony will kill you.",
  "The world is too big to stay in one place.",
  "Travel changes you. It leaves marks on your memory.",
  "Better to see something once than hear about it a thousand times.",
  "If it scares you, it might be a good thing to try."
];

export const ItineraryPanel = ({ 
  locations, 
  userProfile, 
  setUserProfile, 
  onHoverLocation, 
  onRemoveLocation, 
  onDraftEmail 
}: any) => {
  
  const [randomQuote, setRandomQuote] = useState("");

  useEffect(() => {
    setRandomQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile({ ...userProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="absolute top-4 right-4 w-96 bg-white rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
      
      {/* 1. Header Section */}
      <div className="bg-black p-6 text-white text-center">
        <label className="relative cursor-pointer group inline-block">
          <img 
            src={userProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.floor(Math.random() * 1000)}`} 
            className="w-20 h-20 rounded-full border-4 border-blue-500 object-cover mx-auto mb-2 transition-opacity group-hover:opacity-75 bg-white"
            alt="Avatar"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-[10px] font-bold bg-black/40 rounded-full">
            CHANGE
          </div>
          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
        </label>
        
        <input 
          className="bg-transparent text-center font-bold text-lg w-full focus:outline-none border-b border-transparent hover:border-gray-700"
          value={userProfile.name}
          onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
          placeholder="Your Name"
        />
        <input 
          className="bg-transparent text-center text-sm w-full focus:outline-none opacity-60"
          value={userProfile.subtitle}
          onChange={(e) => setUserProfile({...userProfile, subtitle: e.target.value})}
          placeholder="Add a subtitle..."
        />
      </div>

      {/* 2. Content Area */}
      <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
        {locations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-gray-500 italic">
            <p>"{randomQuote}"</p>
            <span className="text-xs mt-2 uppercase tracking-widest opacity-50">- Inspiration -</span>
          </div>
        ) : (
          <div className="space-y-3">
            {locations.map((loc: any, index: number) => (
              <div 
                key={index}
                className="group relative bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all border border-gray-100 cursor-pointer flex items-center space-x-3"
                onMouseEnter={() => onHoverLocation?.(loc.lat, loc.lng)}
              >
                <img 
                  src={loc.photo} 
                  alt={loc.name}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-200"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-800 truncate">{loc.name}</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Verified Location</p>
                </div>

                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveLocation(index); }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Footer Action Button - UPDATED FOR DATAHUB WATCHER */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button 
          onClick={async () => {
            // --- NEW: Triggers the Firestore 'ADDED' event for watch_and_push.py ---
            await onDraftEmail(); 
            console.log("✈️ Itinerary Metadata Sync Triggered & saved to Firestore");
          }}
          disabled={locations.length === 0}
          className={`w-full py-3 rounded-xl font-bold text-lg shadow-lg transition-transform transform active:scale-95 ${
            locations.length === 0 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {locations.length === 0 ? "Pick Places First" : `Draft Email (${locations.length})`}
        </button>
      </div>
    </div>
  );
};