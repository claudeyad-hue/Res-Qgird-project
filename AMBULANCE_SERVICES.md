# Ambulance services

UNIFIED now exposes a source-attributed Ghaziabad ambulance service directory. It is separate from the hospital inventory and does not represent live ambulance dispatch or individual vehicle tracking.

## Current sourced records

The Ghaziabad District Administration's ambulance page reports 43 active 108 ambulances, 43 active 102 ambulances, and two ALS ambulances operated from the District Hospital. The page was last updated January 10, 2024. Those counts are stored as district aggregates on service-level records, never as 88 mapped vehicle points. The source was reviewed on November 13, 2026; the page's 2024 publication date is shown separately from that review date. Availability, exact address, provider location, and operating hours remain Unknown. The district helpline directory also lists 102 and 108.

Sources:

- [Ghaziabad District Administration: ambulance services](https://ghaziabad.nic.in/%E0%A4%97%E0%A4%BE%E0%A4%9C%E0%A4%BF%E0%A4%AF%E0%A4%BE%E0%A4%AC%E0%A4%BE%E0%A4%A6-%E0%A4%AE%E0%A5%87%E0%A4%82-%E0%A4%B8%E0%A4%82%E0%A4%9A%E0%A4%BE%E0%A4%B2%E0%A4%BF%E0%A4%A4-%E0%A4%AF%E0%A5%8B/%E0%A4%A8%E0%A4%BF%E0%A4%83%E0%A4%B6%E0%A5%81%E0%A4%B2%E0%A5%8D%E0%A4%95-%E0%A4%8F%E0%A4%AE%E0%A5%8D%E0%A4%AC%E0%A5%81%E0%A4%B2%E0%A5%87%E0%A4%A8%E0%A5%8D%E0%A4%B8-%E0%A4%B8%E0%A5%87%E0%A4%B5%E0%A4%BE/)
- [Ghaziabad District Administration: helplines](https://ghaziabad.nic.in/helpline/)

No private or hospital-based provider records were added: a current provider source with reliable contact and location details was not verified. No source-published Ghaziabad provider coordinates were identified for the current records, so the map correctly has no markers.

## API

Available at both `/api/ambulances` and `/api/v1/ambulances`:

| Method and path | Access | Purpose |
|---|---|---|
| `GET /ambulances` | Public | Paginated directory. Query: `page`, `limit` (max 100), `search`, `area`, `category`, `serviceType`, `verificationStatus`. |
| `GET /ambulances/nearby?longitude=&latitude=&radiusKm=` | Public | Source-listed provider locations within a radius (max 100 km); district-service records are excluded because they have no location. |
| `GET /ambulances/:id` | Public | Provider or district service details. |
| `POST /ambulances` | Admin | Create a record. Requires unique `recordCode`, provider/service fields, and HTTPS `sourceUrl`. |
| `PUT/PATCH /ambulances/:id` | Admin | Update a record. |
| `PATCH /ambulances/:id/verification` | Admin | Set `verificationStatus`; records the review timestamp. Optional `sourceUrl`. |
| `DELETE /ambulances/:id` | Admin | Delete a record. |

Responses use the existing `{ success, message, data, pagination }` envelope. Writes require a valid bearer token with the `admin` role; these routes do not use the development write-auth bypasses available to some older modules.

## Data model and verification

`Ambulance` records use a unique `recordCode` and normalized provider/name identity key, provider and service fields, an `ownership` enum (`government`, `private`, `unknown`), an enum `category` (`government-108`, `government-102`, `als`, `bls`, `private`, `hospital-based`), contact and location fields, availability, source URL, source publication date, last source review date, and verification status (`official-source`, `provider-confirmed`, `directory-listed`, `unverified`). Locations are GeoJSON `Point`s in `[longitude, latitude]` order with a `2dsphere` index. Category/service indexes support filters.

`scope: district-service` records cannot contain coordinates. The optional `publishedFleetCount` is explicitly aggregate and must never be interpreted as mapped vehicles. Availability defaults to `unknown`; GPS, dispatch, and live availability feeds are not connected. `official-source` means the record is supported by a named official publication; it does not confirm present-day operational availability.

To upsert the curated official records into MongoDB, configure `MONGODB_URI` and run `npm run ambulances:sync` from `backend/`. The upsert is idempotent and only changes records matching the curated record codes. Local in-memory development initializes these sourced records directly; it does not persist across restarts.

Admin-created records should cite a direct source URL. Review contact, classification, and location against that source before setting `provider-confirmed`; retain `directory-listed` when a listing is not independently verified. Recheck source publication dates and availability before any operational use. Do not enter guessed data.

## Frontend

Open **Ambulances** in the dashboard navigation. The responsive page supports name/service search, area and category filters, provider details, source links, a phone action when a source supplies a number, and a Leaflet map for records that have source-backed provider coordinates. The page displays source age, verification status, and unknown availability explicitly.

## Checks

Run `npm run build` from the repository root and `npm run server:test` from the root. The backend suite exercises public reads, admin-only writes, CRUD, category/area filters, nearby geospatial lookup, validation, and district-service coordinate rejection.
