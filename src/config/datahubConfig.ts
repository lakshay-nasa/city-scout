// src/config/datahubConfig.ts

/**
 * Metadata Lineage Definition for CityScout
 * This follows the DataHub entity relationship model.
 */
export const DATAHUB_LINEAGE = {
  project: "CityScout_v1",
  entities: {
    source: {
      name: "Google_Places_API_New",
      type: "External_API",
      description: "Geospatial and landmark metadata source"
    },
    processing: {
      name: "CityScout_React_Engine",
      type: "Application_Logic",
      description: "State management and Unlayer template injection"
    },
    storage: {
      name: "Firebase_Firestore",
      type: "Document_Store",
      collection: "itineraries"
    },
    consumption: {
      name: "Unlayer_Email_Service",
      type: "Data_Product",
      format: "HTML_Email"
    }
  }
};