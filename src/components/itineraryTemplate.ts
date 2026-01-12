// src/components/itineraryTemplate.ts

export const generateLocationsHtml = (locations: any[]) => {
  if (locations.length === 0) {
    return `<div style="text-align:center; padding: 30px; color:#95a5a6; font-style: italic; border: 2px dashed #bdc3c7; border-radius: 8px;">No locations selected yet. Go back and pin some spots!</div>`;
  }

  return locations.map((loc, index) => {
    // Exact same styling as your professional export
    const mapLink = loc.placeId 
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name)}&query_place_id=${loc.placeId}`
      : `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;

    return `
      <div style="margin-bottom: 15px; padding: 15px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; display: flex; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); font-family: Arial, sans-serif;">
        <div style="background-color: #3498db; color: white; font-weight: bold; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; flex-shrink: 0;">
          ${index + 1}
        </div>
        <img 
          src="${loc.photo || 'https://images.unsplash.com/photo-1500835595333-5b4737526b3c?w=400&q=80'}" 
          alt="${loc.name}" 
          style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover; margin-right: 15px; border: 1px solid #eee;" 
        />
        <div style="flex: 1; min-width: 0;">
          <h3 style="margin: 0 0 4px; color: #2c3e50; font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${loc.name}</h3>
          <p style="margin: 0; font-size: 14px; color: #7f8c8d;">
            <a href="${mapLink}" target="_blank" style="color: #3498db; text-decoration: none; font-weight: 600;">
              View on Map →
            </a>
          </p>
        </div>
      </div>
    `;
  }).join('');
};

export const getTemplateJson = (userName: string, subtitle: string) => ({
  // Keep your existing template JSON structure here...
  // Make sure the second row has id: "list-row" so the logic above can find it!
  counters: { u_row: 1, u_column: 1, u_content_html: 1 },
  body: {
    id: "city-scout-root",
    rows: [
      {
        id: "header-row",
        cells: [1],
        columns: [{
          id: "header-col",
          contents: [{
            id: "header-content",
            type: "html",
            values: {
              html: `
                <div style="font-family: Arial, sans-serif; background-color: #ffffff;">
                  <div style="background-image: url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'); background-size: cover; background-position: center; height: 250px; border-radius: 12px 12px 0 0;"></div>
                  <div style="padding: 30px 20px; text-align: center;">
                    <h1 style="margin: 0; color: #2c3e50; font-size: 32px; font-weight: 700;">My Travel Itinerary ✈️</h1>
                    <p style="margin: 10px 0 0; color: #7f8c8d; font-size: 16px;">
                      Curated by <strong>${userName}</strong> <br/>
                      <span style="font-size: 14px; font-style: italic;">${subtitle}</span>
                    </p>
                  </div>
                  <hr style="border: none; border-bottom: 1px solid #ecf0f1; margin: 0 20px;" />
                </div>
              `,
              containerPadding: "0px",
            },
          }],
          values: { _meta: { htmlID: "u_column_1", htmlClassNames: "u_column" } },
        }],
        values: { backgroundColor: "#ffffff", padding: "0px", _meta: { htmlID: "u_row_1", htmlClassNames: "u_row" } },
      },
      {
        id: "list-row", // <--- ENSURE THIS ID MATCHES
        cells: [1],
        columns: [{
          id: "list-col",
          contents: [{
            id: "list-content",
            type: "html",
            values: {
              html: `
                <div style="font-family: Arial, sans-serif; padding: 30px 20px;">
                  <h2 style="margin: 0 0 20px; color: #34495e; font-size: 24px; text-align: center;">📍 Places to Visit</h2>
                  {{trip_list_html}}
                </div>
              `,
              containerPadding: "0px",
            },
          }],
          values: { _meta: { htmlID: "u_column_2", htmlClassNames: "u_column" } },
        }],
        values: { backgroundColor: "#ffffff", padding: "0px", _meta: { htmlID: "u_row_2", htmlClassNames: "u_row" } },
      },
      {
        id: "footer-row",
        cells: [1],
        columns: [{
          id: "footer-col",
          contents: [{
            id: "footer-content",
            type: "html",
            values: {
              html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #f8f9fa; border-radius: 0 0 12px 12px;">
                  <p style="margin: 0; color: #bdc3c7; font-size: 12px;">Created with CityScout • Save & Share Your Journey</p>
                </div>
              `,
              containerPadding: "0px",
            },
          }],
          values: { _meta: { htmlID: "u_column_3", htmlClassNames: "u_column" } },
        }],
        values: { backgroundColor: "#ffffff", padding: "0px", _meta: { htmlID: "u_row_3", htmlClassNames: "u_row" } },
      },
    ],
    values: {
      backgroundColor: "#ecf0f1",
      contentWidth: "600px",
      fontFamily: { label: "Helvetica", value: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
    },
  },
});