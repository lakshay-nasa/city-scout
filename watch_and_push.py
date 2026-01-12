# watch_and_push.py
import time
import firebase_admin
from firebase_admin import credentials, firestore
from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.emitter.rest_emitter import DataHubRestEmitter
from datahub.metadata.schema_classes import (
    DatasetPropertiesClass,
    GlobalTagsClass,
    TagAssociationClass,
    UpstreamLineageClass,
    UpstreamClass,
    DatasetLineageTypeClass
)

# 1. External Source Definition (Provenance)
# This URN creates the "External API" node in your lineage graph
GOOGLE_API_URN = "urn:li:dataset:(urn:li:dataPlatform:external,Google_Places_API,PROD)"

# 2. Initialize Firebase Admin SDK
cred = credentials.Certificate("service_account.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

# 3. Configure DataHub Emitter
emitter = DataHubRestEmitter(gms_server="http://localhost:8080")

def init_upstream_source():
    """Explicitly creates the Google API entity so it shows in Lineage UI"""
    print(f"📡 Initializing upstream source: {GOOGLE_API_URN}")
    api_props = DatasetPropertiesClass(
        description="External Google Places API providing geospatial landmark data.",
        customProperties={"provider": "Google", "interface": "REST API"}
    )
    mcp = MetadataChangeProposalWrapper(
        entityType="dataset", changeType="UPSERT", entityUrn=GOOGLE_API_URN,
        aspectName="datasetProperties", aspect=api_props
    )
    emitter.emit(mcp)

init_upstream_source()

def push_to_datahub(doc_id, data, is_exported=False):
    """
    Emits metadata to DataHub, establishing provenance lineage 
    back to the Google Places API using correct lineage types.
    """
    user_name = data.get('user', {}).get('name', 'Unknown User')
    urn = f"urn:li:dataset:(urn:li:dataPlatform:firestore,itinerary_{doc_id},PROD)"

    # --- ASPECT 1: PROPERTIES ---
    properties_aspect = DatasetPropertiesClass(
        description=f"Travel itinerary created by {user_name}.",
        customProperties={
            "doc_id": doc_id,
            "user": user_name,
            "location_count": str(len(data.get('locations', []))),
            "tabular_ml_ready": "true",
            "source": "CityScout_App",
            "lifecycle_state": "Production" if is_exported else "Staging"
        }
    )
    
    prop_event = MetadataChangeProposalWrapper(
        entityType="dataset", changeType="UPSERT", entityUrn=urn,
        aspectName="datasetProperties", aspect=properties_aspect
    )

    # --- ASPECT 2: TAGS ---
    current_status_tag = "urn:li:tag:Status:Exported" if is_exported else "urn:li:tag:Status:Draft"
    
    tags_aspect = GlobalTagsClass(
        tags=[
            TagAssociationClass(tag=current_status_tag),
            TagAssociationClass(tag="urn:li:tag:Creator_Content"), 
            TagAssociationClass(tag="urn:li:tag:AI_Ready_Tabular"), 
            TagAssociationClass(tag="urn:li:tag:Geospatial_PII")
        ]
    )

    tag_event = MetadataChangeProposalWrapper(
        entityType="dataset", changeType="UPSERT", entityUrn=urn,
        aspectName="globalTags", aspect=tags_aspect
    )

    # --- ASPECT 3: LINEAGE (Provenance) ---
    # FIXED: Changed DatasetLineageTypeClass.DATA_FLOW to TRANSFORMED
    lineage_aspect = UpstreamLineageClass(
        upstreams=[
            UpstreamClass(
                dataset=GOOGLE_API_URN, 
                type=DatasetLineageTypeClass.TRANSFORMED 
            )
        ]
    )
    
    lineage_event = MetadataChangeProposalWrapper(
        entityType="dataset", changeType="UPSERT", entityUrn=urn,
        aspectName="upstreamLineage", aspect=lineage_aspect
    )

    # --- EMIT TO DATAHUB ---
    try:
        emitter.emit(prop_event) 
        emitter.emit(tag_event)
        emitter.emit(lineage_event)
        
        status_label = "EXPORTED" if is_exported else "DRAFT"
        print(f"✅ Full Metadata & Lineage ({status_label}) pushed for: {doc_id}")
    except Exception as e:
        print(f"❌ Failed to emit to DataHub: {e}")

def on_snapshot(col_snapshot, changes, read_time):
    """
    Real-time listener that detects Firestore ADDED/MODIFIED events 
    and determines export status based on document data.
    """
    for change in changes:
        doc_data = change.document.to_dict()
        
        # Determine exported status from the document's 'status' field
        status = doc_data.get('status', 'draft')
        is_exported = (status == 'exported')
        
        # Process new itineraries and status updates
        if change.type.name in ['ADDED', 'MODIFIED']:
            push_to_datahub(change.document.id, doc_data, is_exported=is_exported)

# 4. Start Watching the Collection
print("👀 Watching Firestore 'itineraries' collection for changes...")
db.collection('itineraries').on_snapshot(on_snapshot)

# Keep the main thread alive
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n🛑 Watcher stopped.")