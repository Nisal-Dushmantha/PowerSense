# Deployment Report

## 1. Deployment Overview
PowerSense is deployed using separate cloud services for frontend and backend.

| Service | Platform | Status |
|---------|----------|--------|
| Backend API | Render | Live |
| Frontend App | Vercel | Live |

## 2. Live URLs
- Backend API: https://powersense-2-9w2e.onrender.com
- Frontend App: https://power-sense-gamma.vercel.app/

---

## 3. Backend Deployment (Render)

### Platform
Render Web Service

### Service Configuration
- Root Directory: `BACKEND`
- Build Command: `npm install`
- Start Command: `npm start`

### Required Environment Variables
```env
NODE_ENV=production
PORT=10000
MONGO_URI=<mongodb_uri>
JWT_SECRET=<jwt_secret>
WHATSAPP_ENABLED=false
WHATSAPP_WEB_ENABLED=false
WHATSAPP_BILL_NOTIFICATIONS_ENABLED=false
```

### Post-Deploy Verification
1. Open: `https://powersense-2-9w2e.onrender.com`
2. Confirm response indicates backend is running
3. Confirm database state is connected

---

## 4. Frontend Deployment (Vercel)

### Platform
Vercel

### Build Configuration
- Framework: React
- Project Root: `frontend`
- Build Command: `npm run build`
- Output Directory: `build`

### Required Environment Variable
```env
REACT_APP_API_URL=https://powersense-2-9w2e.onrender.com/api
```

### Post-Deploy Verification
1. Open: `https://power-sense-gamma.vercel.app/`
2. Verify home/login/register pages load
3. Verify authenticated pages can reach backend API

---

## 5. Evidence Checklist for Submission
Capture and include screenshots of:
1. Render dashboard showing live backend service
2. Vercel dashboard showing successful deployment
3. Backend base URL response JSON
4. Frontend landing page
5. Frontend authenticated module page

---

## 6. Operational Notes
- Render free-tier services may cold-start after inactivity.
- WhatsApp browser-session features are intentionally disabled in cloud deployment for production stability unless persistent session handling is configured.

