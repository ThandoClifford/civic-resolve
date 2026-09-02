# CivicResolve

CivicResolve is an intelligent municipal service reporting and response platform. The current application allows citizens to report service issues and lets municipal staff review, update, and monitor those issues through a simple web interface.

## Project Overview

The system currently supports:
- Reporting issues with location details and optional image links
- Viewing and managing issues in a list view
- Opening issue details and adding updates
- Reviewing issue analytics through the available reports pages

## Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose
- Frontend: React, Vite, TailwindCSS, Leaflet

## Setup

### Prerequisites
- Node.js
- MongoDB running locally or available through a connection string

### Installation

1. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

3. Configure environment in the server directory if needed:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/municipal_complaints
   ```

4. Seed sample data:
   ```bash
   cd server
   node seed.js
   ```

5. Start the backend:
   ```bash
   npm start
   ```

6. Start the frontend in a separate terminal:
   ```bash
   cd client
   npm run dev
   ```

## Explainable Priority Scoring Engine

CivicResolve uses a transparent priority scoring engine to help municipal staff sort complaints by urgency. The server calculates a score from 0 to 100 and records both the numeric result and the reasoning behind it.

Scoring factors and maximum weights:
- Safety risk: 30 points
- Environmental impact: 20 points
- People affected: 20 points
- Location sensitivity: 15 points
- Issue age: 15 points

Priority thresholds:
- 0-29: LOW
- 30-59: MEDIUM
- 60-79: HIGH
- 80-100: CRITICAL

The engine is explainable because each complaint stores a breakdown object and a human-readable explanation generated from the actual factor values. Legacy complaints are preserved even if they do not yet have priority engine data.

## Explainable Related-Issue Detection

CivicResolve uses rule-based similarity analysis to identify complaints that may refer to the same underlying municipal issue. Complaints are never merged automatically; each remains an independent record.

Similarity factors and weights:
- Geographic proximity: 35 points
- Category similarity: 25 points
- Text similarity: 25 points
- Time proximity: 15 points

Similarity thresholds:
- 0-29: UNRELATED
- 30-59: POSSIBLY RELATED
- 60-79: LIKELY RELATED
- 80-100: STRONGLY RELATED

Methods used:
- Geographic method: Haversine distance on complaint coordinates with distance bands.
- Text method: normalized token overlap (Jaccard similarity) over title + description with stop-word removal.
- Time method: day-difference bands with bounded contribution.

Explainability:
- Every related result stores a total score, relationship level, factor breakdown, and generated explanation.

Limitations:
- Candidate comparisons are filtered to a bounded window (category/time and nearby coordinate ranges) and a result limit for practical performance.
- This can miss some distant but semantically related complaints, but keeps runtime predictable for project scale.
- Full related-issue detail is intentionally shown to municipal officials and admins in the UI for privacy safety.

## Current API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Issues
- GET /api/complaints
- GET /api/complaints/:id
- GET /api/complaints/:id/related
- POST /api/complaints
- PUT /api/complaints/:id
- DELETE /api/complaints/:id
- POST /api/complaints/:id/updates
- POST /api/complaints/:id/images
- POST /api/complaints/:id/calculate-priority

### Phase 3B Migration Note
- Legacy complaints may have `reportedBy = null`.
- Those records are preserved and are not backfilled with fake ownership.
- Citizens only receive complaints they own; municipal officials and admins can still access legacy records.

### Analytics
- GET /api/reports/category
- GET /api/reports/area
- GET /api/reports/high-priority
- GET /api/reports/monthly-trend
- GET /api/reports/hotspots
- GET /api/reports/status
- GET /api/reports/priority

## CivicResolve SmartLight

CivicResolve SmartLight is an IoT-based streetlight fault detection and maintenance prioritisation prototype built on top of the existing CivicResolve municipal complaint platform.

### Demo Locations

The SmartLight prototype uses five simulated streetlights clustered around a single demo campus area. These coordinates are for demonstration purposes only and do not represent actual municipal infrastructure.

| ID | Name | Installation Type | Area |
|---|---|---|---|
| SL-001 | Main Entrance | SCHOOL | Demo Campus - Main Gate |
| SL-002 | Main Road | MAIN_ROAD | Demo Campus - Main Road |
| SL-003 | Pedestrian Crossing | PEDESTRIAN_CROSSING | Demo Campus - Pedestrian Crossing |
| SL-004 | Residential Street | RESIDENTIAL | Demo Campus - Residential Side Street |
| SL-005 | Taxi Rank | TAXI_RANK | Demo Campus - Transport/Taxi Area |

### Running the SmartLight Demo

1. Start the backend:
   ```bash
   cd server
   npm start
   ```

2. Start the frontend in a separate terminal:
   ```bash
   cd client
   npm run dev
   ```

3. Start the simulator in a separate terminal:
   ```bash
   # From the project root
   set DEVICE_API_KEY=your_device_api_key_here
   node simulator/streetlightSimulator.js
   ```

4. Log in as a municipal official or admin and open:
   ```
   http://localhost:3000/smartlight
   ```

### Simulator Commands

While the simulator is running, type these commands in its terminal:

| Command | Effect |
|---|---|
| `SL003_OFF` | Simulates SL-003 lamp failure (lamp OFF, near-zero current) |
| `SL004_OFFLINE` | Simulates SL-004 device going offline |
| `SL005_LOW_CURRENT` | Simulates SL-005 low current warning |
| `RESET` | Clears all fault simulations and returns to normal telemetry |
| `STOP` | Pauses simulator telemetry |
| `START` | Resumes simulator telemetry |
| `EXIT` | Stops the simulator |

### Resetting the SmartLight Demo

To restore the SmartLight demonstration to its initial state without affecting users or complaints:

```bash
cd server
npm run reset-smartlight-demo
```

This command:
- Restores the 5 demo streetlights to healthy starting states
- Removes all SmartLight telemetry test data
- Removes all SmartLight fault test data
- Preserves users, authentication accounts, and unrelated complaint data

### System Architecture

```
Virtual IoT Streetlights
        ↓
Telemetry Simulator
        ↓
Device-authenticated REST API
        ↓
Telemetry Storage
        ↓
Fault Detection Engine
        ↓
Explainable Priority Engine
        ↓
MongoDB
        ↓
Socket.IO
        ↓
React Municipal Dashboard
        ↓
Maintenance Workflow
```

**Important note:** The current prototype uses simulated IoT telemetry. The telemetry API (`POST /api/telemetry`) is device-independent and can later accept readings from physical IoT hardware using the same JSON contract. No physical streetlight devices are currently deployed.
