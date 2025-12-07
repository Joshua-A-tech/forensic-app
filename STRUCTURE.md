Project structure (Vercel-friendly)

Top-level layout designed for Vercel hosting and clarity:

- `public/` : All static frontend assets (HTML, CSS, JS, images). Vercel serves files here automatically.
- `api/` : Serverless functions. `api/server.js` wraps the Express `app` for Vercel.
- `src/` : Application source code and route/controller organization (DB config, controllers, models, middleware).
- `migrations/` : SQL migration files applied to the database.
- `scripts/` : Helpful scripts (e.g., `migrate.js`).
- `archive/` : Archived copies of older files (kept for reference).
- `deploy-scripts/` : Deployment helper scripts (PowerShell, etc.).

Notes & recommendations:
- Keep all end-user-facing static files inside `public/`. This lets Vercel serve them from the CDN without invoking serverless functions.
- Expose API endpoints via `api/` serverless functions (or by routing `/api` to a serverless wrapper). Avoid routing all requests through a single serverless function unless you need server-side rendering.
- Sensitive environment variables (e.g. `DATABASE_URL`, `JWT_SECRET`, `ADMIN_TOKEN`) should be configured in the Vercel Dashboard — never commit them to the repo.
- If you need to run migrations in the same network as the DB, prefer running them from your CI/CD environment or a restricted one-off serverless function that is created, executed, then removed.

Quick checklist to deploy on Vercel:
1. Ensure `public/` contains `index.html` (or a redirect) — already created.
2. Ensure `api/server.js` exists and exports the serverless handler — already present.
3. Push to Git and let Vercel build; static assets will be served from `public/` and API calls routed to `api/`.

If you'd like, I can also:
- Move any remaining top-level static files into `public/` (I already cleaned duplicates).
- Run a quick deploy and confirm root and `/health` endpoints.
