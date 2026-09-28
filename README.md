# HealthTrack — Full-Stack Health & Wellness Tracker

A polished resume-ready health tracking web application built with the **MEAN stack**.

## Stack
- MongoDB + Mongoose
- Express.js
- Angular 18
- Node.js
- Chart.js
- JWT-ready authentication architecture
- REST API
- Responsive CSS

## Core features
- Dashboard with daily wellness summary
- Step, water, sleep and calorie tracking
- BMI calculator
- 7-day activity visualization
- Wellness goals and progress
- Health history
- Add/edit/delete daily logs
- User profile/settings UI
- Login/register screens
- API health check
- MongoDB persistence
- Demo fallback data when MongoDB is unavailable
- Responsive desktop/mobile interface

## Run

### 1. Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

Frontend: http://localhost:4200  
API: http://localhost:5000/api

Set `MONGODB_URI` in `backend/.env`.

> Do not commit `.env` or credentials to GitHub.
