# Find Pharma Backend

Node.js + Express REST API with JWT authentication and MongoDB Atlas.

## API Endpoints

| Method | URL | Description | Auth |
|--------|-----|-------------|------|
| GET | `/health` | Health check | No |
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Register
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "secret123"
}
```
Returns `{ token, user }` — send token as `Authorization: Bearer <token>` header.

---

## Local Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in values
3. `npm run dev`

---

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import that repo
3. Add these Environment Variables in Vercel project settings:
   - `MONGODB_URI` — your MongoDB Atlas connection string
   - `JWT_SECRET` — a random strong secret (e.g. from `openssl rand -hex 32`)
   - `JWT_EXPIRES_IN` — `7d`
   - `FRONTEND_URL` — your Angular Vercel URL (e.g. `https://find-pharma.vercel.app`)
4. Deploy — Vercel will auto-detect `vercel.json`

---

## MongoDB Atlas Setup (Free)

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) → Create free cluster
2. Create a database user (remember username/password)
3. Whitelist IP: `0.0.0.0/0` (allow all — required for Vercel serverless)
4. Get connection string → replace `<username>` and `<password>` in `MONGODB_URI`
