// src/components/ItineraryEditor.tsx
import { useRef, useState } from 'react';
import EmailEditor from 'react-email-editor';
import { generateLocationsHtml, getTemplateJson } from './itineraryTemplate';
// Imports for Firestore status update
import { db } from '../config/firebase'; 
import { updateDoc, doc } from 'firebase/firestore';

// Updated interface to include currentDocId to resolve TS(2322)
interface EditorProps {
  selectedLocations: any[];
  userProfile: any;
  currentDocId: string | null; // Captures the active document ID for the metadata lifecycle
  onShowNotification: (msg: string, type: 'success' | 'warn') => void;
}

export const ItineraryEditor = ({ 
  selectedLocations, 
  userProfile, 
  currentDocId, 
  onShowNotification 
}: EditorProps) => {
  const emailEditorRef = useRef<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  /**
   * onReady - Initializes the Unlayer Editor with professional travel templates
   * and live-injects the chosen locations for a direct preview.
   */
  const onReady = () => {
    if (!emailEditorRef.current?.editor) return;

    const editor = emailEditorRef.current.editor;
    
    // 1. Generate the actual HTML cards using your existing logic
    const locationsHtml = generateLocationsHtml(selectedLocations);
    
    // 2. Get the raw Template JSON
    const templateJson = getTemplateJson(userProfile.name, userProfile.subtitle);

    // 3. Inject the HTML directly into the JSON so the editor displays it immediately
    const listRow = templateJson.body.rows.find(row => row.id === 'list-row');
    if (listRow && listRow.columns[0].contents[0].values) {
        // Replace the placeholder tag with actual HTML content for the editor view
        listRow.columns[0].contents[0].values.html = listRow.columns[0].contents[0].values.html.replace(
            '{{trip_list_html}}', 
            locationsHtml
        );
    }

    setTimeout(() => {
      editor.loadDesign(templateJson);
      
      // Keep merge tags for the export logic
      editor.setMergeTags({
        trip_list_html: { name: "Trip List HTML", value: locationsHtml },
        user_name: { name: "User Name", value: userProfile.name },
        user_avatar: { name: "User Avatar", value: userProfile.avatar }
      });
      console.log("✅ Professional Template Loaded with Live Preview");
    }, 100);
  };

  /**
   * handleExport - Finalizes the email by replacing all dynamic tags,
   * updates the Firestore status to trigger a DataHub tag change (Draft -> Exported),
   * and provides a one-click download and clipboard copy.
   */
  const handleExport = async () => {
    setIsExporting(true);

    // --- NEW: Update status in Firestore using the passed currentDocId ---
    try {
      if (currentDocId) {
        console.log("🚀 Finalizing Metadata Status for ID:", currentDocId);
        
        // Direct update using the ID - triggers the 'MODIFIED' event in watch_and_push.py
        await updateDoc(doc(db, "itineraries", currentDocId), {
          status: 'exported',
          exportedAt: new Date().toISOString()
        });
        
        console.log("✅ Firestore Status updated to 'exported'");
      } else {
        console.warn("⚠️ No currentDocId found. Metadata update skipped.");
      }
    } catch (e) {
      console.warn("⚠️ Metadata status update failed, proceeding with export anyway.", e);
    }
    
    emailEditorRef.current?.editor?.exportHtml((data: any) => {
      let { html } = data;

      // 1. Generate the finalized HTML list for the export
      const locationsHtml = generateLocationsHtml(selectedLocations);

      // 2. Perform Replacements for the final file
      html = html.replace('{{trip_list_html}}', locationsHtml);
      html = html.replace('{{user_name}}', userProfile.name);
      html = html.replace('{{user_subtitle}}', userProfile.subtitle || " "); 

      // 3. Copy finalized HTML to Clipboard
      navigator.clipboard.writeText(html).then(() => {
        onShowNotification("Metadata Finalized & HTML Copied! 🚀", "success");
        setIsExporting(false);
      });
      
      // 4. Trigger Automatic File Download
      const blob = new Blob([html], { type: 'text/html' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const safeFilename = userProfile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `itinerary_${safeFilename}.html`;
      link.click();
    });
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header Bar */}
      <div className="p-4 bg-white border-b flex justify-between items-center z-20 shadow-sm">
        <div>
          <h2 className="font-bold text-xl text-gray-800">Email Draft</h2>
          <p className="text-sm text-gray-500">Review and export your itinerary. DataHub tags will update to 'Exported' now.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={isExporting}
          className={`px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all ${
            isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
          } flex items-center space-x-2`}
        >
          <span>{isExporting ? 'Exporting...' : 'Download & Copy HTML'}</span>
          {!isExporting && <span>📋</span>}
        </button>
      </div>
      
      {/* Editor Canvas */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          <EmailEditor 
            ref={emailEditorRef} 
            onReady={onReady}
            minHeight="100%"
            options={{
              projectId: parseInt(import.meta.env.VITE_UNLAYER_PROJECT_ID),
              displayMode: 'email',
              appearance: { theme: 'modern_light' }
            }}
          />
        </div>
      </div>
    </div>
  );
};