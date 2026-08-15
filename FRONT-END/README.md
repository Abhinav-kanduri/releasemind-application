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

The application does not expose a credential sign-in screen. `/sign-in`
redirects to the GitHub Data Source, and the sidebar contains no
sign-in/sign-out controls. Protected backend operations still use trusted
server-side identity configuration; browser-supplied actor headers are not
trusted.

For local development only, `PROJECT_MANAGEMENT_ACTOR_ID=<existing-project-member-uuid>` can be used when there is no Supabase session. This fallback is disabled in production. Authentication and authorization remain separate: a valid Supabase account receives `403` from protected backend operations until a Project administrator assigns that user to the selected Project.

Protected Next.js routes call `supabase.auth.getUser()` before deriving
`auth.users.id`. They discard browser-supplied `X-Actor` and `Authorization`
headers and forward only identity and bearer data read from the validated
server session.

`PROJECT_MANAGEMENT_ACTOR_ID` must never be a random UUID or a `NEXT_PUBLIC_*`
variable. The backend membership command is documented in
`project-management-tool/docs/impact-analysis.md`.
