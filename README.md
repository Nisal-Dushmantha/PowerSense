# PowerSense — Intelligent Energy Management Platform

> A full-stack MERN-style application for electricity usage tracking, bill management, analytics, renewable integration, and role-based administration.

## Home Page Preview

![PowerSense Home Page](https://image.thum.io/get/width/1400/https://powersense-af.vercel.app/)

| Layer | Technology |
|------|------------|
| Frontend | React, React Router, Axios, Tailwind CSS |
| Backend | Node.js, Express.js, MongoDB, Mongoose, JWT |
| Testing | Jest, Supertest, Artillery |
| Deployment | Vercel (frontend), Render (backend) |

---

## Table of Contents
1. [Home Page Preview](#home-page-preview)
2. [Project Overview](#project-overview)
3. [Core Components](#core-components)
4. [Project Structure](#project-structure)
5. [Setup Instructions](#setup-instructions)
6. [API Documentation](#api-documentation)
7. [Deployment](DEPLOYMENT.md)
8. [Testing](TESTING.md)
9. [Submission Evidence Checklist](#submission-evidence-checklist)
10. [Environment Variables](#environment-variables)
11. [Security & Architecture Notes](#security--architecture-notes)

---

## Project Overview
PowerSense is developed for **SE3040 – Application Frameworks (2026)** and focuses on practical, data-driven energy management:
- Track consumption records and trends
- Manage household/device energy usage
- Analyze carbon footprint and threshold alerts
- Track monthly bills and payment states
- Manage renewable sources and production records
- Provide admin visibility and user governance

---

## Core Components
1. **Authentication & Profile**
2. **Device Management**
3. **Energy Consumption Monitoring**
4. **Energy Analytics & Reporting**
5. **Monthly Bill Management**
6. **Renewable Energy Management**
7. **Admin Management**

---

## Project Structure
```text
PowerSense/
├── BACKEND/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── performance/
│   ├── app.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── App.js
│   └── package.json
├── DEPLOYMENT.md
├── TESTING.md
└── README.md
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas (recommended) or local MongoDB

### Backend
```bash
cd BACKEND
npm install
```

Create `BACKEND/.env`:
```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret>
NODE_ENV=development

# Keep disabled in cloud unless persistent WhatsApp session handling is configured
WHATSAPP_ENABLED=false
WHATSAPP_WEB_ENABLED=false
```

Start backend:
```bash
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start
```

Default local URLs:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

---

## API Documentation

**Base URL**
- Local: `http://localhost:5000/api`
- Production: `https://powersense-2-9w2e.onrender.com/api`

### Authentication Header (Protected Routes)
```http
Authorization: Bearer <token>
```

### Auth Routes (`/api/auth`)
- `POST /register`
- `POST /send-whatsapp-otp`
- `POST /verify-whatsapp-otp`
- `POST /login`
- `GET /me` *(protected)*
- `PUT /profile` *(protected)*
- `PUT /change-password` *(protected)*
- `PUT /threshold` *(protected)*

### Energy Consumption (`/api/energy-consumption`) *(protected)*
- `POST /`
- `GET /`
- `GET /total`
- `GET /summary`
- `GET /integration`
- `PUT /:id`
- `DELETE /:id`

### Energy Analytics (`/api/energy-analytics`) *(protected)*
- `GET /peak`
- `GET /alerts`
- `GET /carbon`
- `GET /comparison`
- `GET /recommendations`
- `GET /report/pdf`
- `POST /whatsapp/start`
- `GET /whatsapp/status`
- `GET /whatsapp/qr`
- `POST /whatsapp/send-summary`
- `POST /whatsapp/send-threshold-alerts`

### Device Routes (`/api/devices`) *(protected)*
- `POST /`
- `GET /`
- `GET /export/pdf`
- `GET /:deviceId`
- `PUT /:deviceId`
- `DELETE /:deviceId`

---

## Live Deployment
- Frontend: https://powersense-af.vercel.app/
- Backend: https://powersense-2-9w2e.onrender.com

Detailed deployment instructions: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Testing
Detailed test instructions and commands are available in [TESTING.md](TESTING.md).

### Implemented Energy Module Tests
- Unit: `tests/unit/energyAnalytics.controller.test.js`
- Unit: `tests/unit/energyConsumption.controller.test.js`
- Integration: `tests/integration/energyAnalytics.routes.test.js`
- Performance scenario: `tests/performance/energy-analytics-load-test.yml`

---

## Submission Evidence Checklist

### Deployment Evidence
- [x] Render dashboard live: [docs/screenshots/deployment/render-dashboard-live.png](docs/screenshots/deployment/render-dashboard-live.png)
- [x] Vercel deployment ready: [docs/screenshots/deployment/vercel-deployment-ready.png](docs/screenshots/deployment/vercel-deployment-ready.png)
- [x] Backend health response: [docs/screenshots/deployment/backend-health-response.png](docs/screenshots/deployment/backend-health-response.png)

### Application Evidence
- [x] Frontend homepage live: [docs/screenshots/app/frontend-homepage-live.png](docs/screenshots/app/frontend-homepage-live.png)
- [x] Frontend login page: [docs/screenshots/app/frontend-login-page.png](docs/screenshots/app/frontend-login-page.png)
- [x] Authenticated analytics page: [docs/screenshots/app/frontend-authenticated-analytics-page.png](docs/screenshots/app/frontend-authenticated-analytics-page.png)

### Testing Evidence
- [x] Postman login 200: [docs/screenshots/testing/postman-auth-login-200.png](docs/screenshots/testing/postman-auth-login-200.png)
- [x] Postman alerts 200: [docs/screenshots/testing/postman-energy-alerts-200.png](docs/screenshots/testing/postman-energy-alerts-200.png)
- [x] Unit tests pass: [docs/screenshots/testing/unit-tests-pass.png](docs/screenshots/testing/unit-tests-pass.png)
- [x] Integration tests pass: [docs/screenshots/testing/integration-tests-pass.png](docs/screenshots/testing/integration-tests-pass.png)
- [x] Artillery performance summary: [docs/screenshots/testing/artillery-performance-summary.png](docs/screenshots/testing/artillery-performance-summary.png)

---

## Environment Variables

### Backend (`BACKEND/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Backend service port |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `NODE_ENV` | Yes | Runtime environment |
| `WHATSAPP_ENABLED` | No | Energy WhatsApp module toggle |
| `WHATSAPP_WEB_ENABLED` | No | OTP WhatsApp module toggle |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_API_URL` | Yes (prod) | Backend API base URL |

---

## Security & Architecture Notes
- JWT-based protected routes and admin authorization middleware are implemented.
- Validation and error handling are applied across models/controllers/routes.
- User-scoped data access is enforced in module controllers.
- For cloud stability (Render), WhatsApp web-session features remain disabled by default.

