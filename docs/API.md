# HealthTrack API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health | API/database status |
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login |
| GET | /api/logs | Fetch health logs |
| POST | /api/logs | Create health log |
| PUT | /api/logs/:id | Update health log |
| DELETE | /api/logs/:id | Delete health log |

The frontend consumes the Express REST API. MongoDB persistence is handled with Mongoose.
