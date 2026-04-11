# PowerSense - Full Stack Application (SE3040)

## Project Overview
PowerSense is a MERN full-stack application for electricity and renewable energy management. This repository contains:
- Backend: Express.js REST API with MongoDB
- Frontend: React application with protected routes and API integration

## Components
1. Authentication and user management
2. Monthly bill management
3. Renewable source management
4. Renewable energy records and analytics (forecast, alerts, variance, maintenance)

## Tech Stack
- Backend: Node.js, Express.js, MongoDB, Mongoose, JWT
- Frontend: React, React Router, Axios, Tailwind CSS
- Reporting: PDF and CSV exports

## Setup Instructions
### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB connection string

### 1) Clone and install
```bash
git clone <your-repository-url>
cd PowerSense
cd BACKEND && npm install
cd ../frontend && npm install
```

### 2) Environment variables
Create `BACKEND/.env` with:
```env
PORT=5000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<strong-random-secret>
```

Create `frontend/.env` with:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3) Run application
```bash
cd BACKEND
npm run dev
```
```bash
cd frontend
npm run dev
```

## Renewable API Endpoint Documentation
Base URL: `http://localhost:5000/api/renewable`

### Sources
- `POST /sources` create source
- `GET /sources` list sources
- `GET /sources/:id` get source
- `PUT /sources/:id` update source
- `DELETE /sources/:id` delete source

### Energy Records
- `POST /records` create record
- `GET /records` list records
- `GET /records/:id` get record
- `PUT /records/:id` update record
- `DELETE /records/:id` delete record

### Analytics and Features
- `GET /dashboard`
- `GET /stats`
- `GET /meters`
- `GET /peak-detection`
- `GET /alerts`
- `GET /independence`
- `GET /recommendations`
- `GET /forecast`
- `GET /forecast/accuracy`
- `GET /variance`
- `GET /variance/trend`
- `GET /weather-insights` (third-party integration with Open-Meteo)

### Maintenance
- `POST /maintenance`
- `GET /maintenance`
- `GET /maintenance/summary`
- `PUT /maintenance/:id`
- `DELETE /maintenance/:id`

### Reports
- `GET /reports/pdf`
- `GET /reports/csv`
- `GET /reports/sources/pdf`
- `GET /reports/sources/csv`
- `GET /reports/summary/pdf`

### Role-Based Access Endpoint
- `GET /admin/overview` requires `admin` role

### API Docs Files
- OpenAPI: `BACKEND/docs/openapi.yaml`
- Postman Collection: `BACKEND/docs/postman/PowerSense-Renewable.postman_collection.json`

## Testing Instruction Report
### Unit Testing
```bash
cd BACKEND
npm run test:unit
```
Covers pure helper logic used in renewable analytics.

### Integration Testing
```bash
cd BACKEND
npm run test:integration
```
Uses `mongodb-memory-server` and `supertest` for renewable route integration tests.

### Performance Testing
1. Start backend server.
2. Set a valid JWT token as environment variable:
```bash
set PERF_TEST_TOKEN=<jwt-token>
```
3. Run load test:
```bash
cd BACKEND
npm run test:performance
```
Artillery scenario file: `BACKEND/tests/performance/renewable-load-test.yml`

### Test Environment Configuration
- `NODE_ENV=test`
- Test DB: in-memory MongoDB
- Auth: JWT via test secret

## Deployment Section
### Backend Deployment (Render/Railway)
1. Create a new web service from `BACKEND`.
2. Build command: `npm install`
3. Start command: `npm start`
4. Set environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `PORT` (optional)

### Frontend Deployment (Vercel/Netlify)
1. Create a project from `frontend`.
2. Build command: `npm run build`
3. Publish directory: `build`
4. Set env variable:
   - `REACT_APP_API_URL=<deployed-backend-url>/api`

### Live URLs
- Backend API URL: `<add-backend-live-url>`
- Frontend App URL: `<add-frontend-live-url>`

### Deployment Evidence
Add screenshots in your report for:
- Backend service running
- Frontend app running
- Successful API call from frontend to deployed backend

## Git Workflow Guidance
- Use feature branches by component
- Commit frequently with meaningful messages
- Avoid large unreviewed commits
- Keep backend and frontend changes logically separated when possible
