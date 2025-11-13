# VRMS Backend

This is the backend for the Vehicle Registration and Licensing System (VRMS).

Stack: Node.js, Express, MongoDB (Mongoose)

Quick start

1. Copy `.env.example` to `.env` and update `MONGO_URI` if needed.
   ```powershell
   cd backend
   Copy-Item .env.example .env
   # Optional: edit .env to adjust MONGO_URI, PORT, or CORS_ORIGIN
   ```
2. Install dependencies and run:

```powershell
cd backend
npm install
npm run dev   # requires nodemon
```

API endpoints (examples):
- GET /api/drivers
- POST /api/drivers
- GET /api/vehicles
- POST /api/vehicles

Environment variables

| Variable | Description | Default |
| -------- | ----------- | ------- |
| `MONGO_URI` | Mongo connection string (include database name) | `mongodb://localhost:27017/vrms` |
| `PORT` | HTTP port for Express | `5000` |
| `CORS_ORIGIN` | (Optional) Restrict CORS to a specific origin | not set |

The server listens on port specified by `PORT` (default 5000).
