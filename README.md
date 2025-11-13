# Vehicle Registration & Licensing System (VRMS) — Minimal MERN Scaffold

This repository contains a minimal MERN-stack scaffold for a Vehicle Registration and Licensing System. It includes:

- `backend/` — Express + Mongoose API (drivers, vehicles)
- `frontend/` — Vite + React UI (simple pages to list and create drivers/vehicles)

Prerequisites

- Node.js (16+ recommended)
- npm
- MongoDB (local or remote). Default connection string: `mongodb://localhost:27017/`

Quick start (PowerShell)

1. Start backend

```powershell
cd backend
npm install
copy .env.example .env
# edit .env if you need to change MONGO_URI
npm run dev
```

2. Start frontend (in another terminal)

```powershell
cd frontend
npm install
npm run dev
```

Open the frontend URL printed by Vite (typically http://localhost:5173). The frontend will call the backend API at `http://localhost:5000` by default.

Deployment (Render + Vercel)

1. Push this repo to GitHub (or the provider of your choice).

2. Backend (Render):
   - Create a new **Web Service**, selecting the `backend/` directory.
   - Build command: `npm install`
   - Start command: `npm run start`
   - Environment variables:
     - `MONGO_URI` — production Mongo connection string (e.g. Atlas)
     - `CORS_ORIGIN` — comma-separated list of allowed origins (add your Vercel URL once known)
   - Deploy and note the Render URL (e.g. `https://vrms-backend.onrender.com`).

3. Frontend (Vercel):
   - Create a new project using the `frontend/` directory.
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable:
     - `VITE_API_URL` — point this to the Render backend URL.
   - Deploy. If you later add a custom domain, update `CORS_ORIGIN` on Render to include it.

4. Smoke test:
   - `curl https://<render-backend>/` should return the JSON health message.
   - Visit the Vercel URL and confirm drivers/vehicles load without CORS errors.

Next steps / recommendations

- Add authentication & role-based access control (admins, clerks).
- Add validation & sanitization for inputs.
- Add pagination, filtering, and richer vehicle/license workflows (transfers, renewals).
- Add unit and integration tests for API routes and React components.

If you want, I can:
- Add authentication (JWT) and protected routes
- Add a simple admin UI for transfers and renewals
- Add unit tests and a CI workflow
