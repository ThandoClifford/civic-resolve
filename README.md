# Illegal Dumping Complaint Tracker

A MongoDB-focused mini application for DICT411 (Advanced Database) demonstrating NoSQL concepts, embedded documents, arrays, and aggregation pipelines.

## Project Overview

This system allows citizens to report illegal dumping and other municipal issues. It demonstrates MongoDB's strengths with:
- Embedded documents
- Arrays of subdocuments
- Geospatial indexing
- Aggregation pipelines
- Text search indexing

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React, Vite, TailwindCSS, Leaflet (map)
- **Database:** MongoDB

## Features

### CRUD Operations
- Create complaint with location and images
- Read complaints (list and detail view)
- Update complaint (status, priority, assignments)
- Delete complaint
- Add updates to updates[] array
- Add images to images[] array

### MongoDB Data Structure

```javascript
{
  title: String,
  category: String,
  priority: String,
  status: String,
  location: {
    areaName: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  assignedTeam: { name: String, members: [String] },
  images: [{ url: String, uploadedAt: Date }],
  updates: [{ status: String, comment: String, updatedAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
```

### Aggregation Reports (API Endpoints)

1. `/api/reports/category` - Complaints per category
2. `/api/reports/area` - Complaints per area (location.areaName)
3. `/api/reports/high-priority` - High priority complaints count
4. `/api/reports/monthly-trend` - Monthly complaints trend
5. `/api/reports/hotspots` - Top 5 hotspot areas

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (running locally or cloud)

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Configure environment:
   Create a `.env` file in the `server` directory:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/municipal_complaints
   NODE_ENV=development
   ```

5. Seed the database with sample data:
   ```bash
   cd server
   node seed.js
   ```

6. Start the backend:
   ```bash
   npm start
   ```
   Server runs on http://localhost:5000

7. Start the frontend (in a new terminal):
   ```bash
   cd client
   npm run dev
   ```
   Frontend runs on http://localhost:5173

## API Endpoints

### Complaints
- `GET    /api/complaints` - List all (with optional filters)
- `GET    /api/complaints/:id` - Get single complaint
- `POST   /api/complaints` - Create new complaint
- `PUT    /api/complaints/:id` - Update complaint
- `DELETE /api/complaints/:id` - Delete complaint
- `POST   /api/complaints/:id/updates` - Add update to array
- `POST   /api/complaints/:id/images` - Add image to array

### Reports (Aggregation)
- `GET /api/reports/category`
- `GET /api/reports/area`
- `GET /api/reports/high-priority`
- `GET /api/reports/monthly-trend`
- `GET /api/reports/hotspots`
- `GET /api/reports/status`
- `GET /api/reports/priority`

## Demo Credentials

No authentication required. The system is open for demonstration.

## Project Structure

```
municipal-complaint-system/
├── server/
│   ├── controllers/
│   │   ├── complaintController.js
│   │   └── reportsController.js
│   ├── models/
│   │   └── Complaint.js
│   ├── routes/
│   │   ├── complaints.js
│   │   └── reports.js
│   ├── seed.js
│   └── index.js
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Landing.jsx
│       │   ├── SubmitComplaint.jsx
│       │   ├── ViewComplaints.jsx
│       │   └── Reports.jsx
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ComplaintModal.jsx
│       ├── services/
│       │   └── api.js
│       ├── App.jsx
│       └── main.jsx
└── README.md
```

## NoSQL Concepts Demonstrated

1. **Embedded Documents** - `location` object embedded directly
2. **Arrays of Subdocuments** - `updates[]` and `images[]` arrays
3. **Geospatial Indexing** - `2dsphere` index on coordinates
4. **Text Indexing** - Full-text search on title/description/area
5. **Aggregation Pipeline** - Multiple stages for analytics
6. **Array Operations** - `$push` updates via API

## License

This project is created for educational purposes (DICT411 - Advanced Database).
