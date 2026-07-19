# ReleaseLens AI

Production-style Next.js 15 frontend for the release-aware product knowledge platform.

## Run

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Use `npm run build` for a production verification.
# Project Management API

Set `PROJECT_MANAGEMENT_API_URL=http://127.0.0.1:8001` to load and sync workspace and planning data from the ReleaseLens FastAPI backend. The existing `NEXT_PUBLIC_PROJECT_MANAGEMENT_URL` variable is also supported. Requests are proxied through Next.js for local development.
