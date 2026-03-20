# Dues-Jobs Backend

Node.js + Express backend service for the daily job-finder SaaS.

## Features

- **Daily Job Fetch**: Scheduled cron job to fetch jobs from multiple sources (Mocked: LinkedIn, Indeed, etc.).
- **Deduplication**: Automatically removes duplicates using canonical hashing.
- **Smart Matching**: Matches jobs to users based on preferences (Keywords, Location, Remote, Source).
- **Notifications**: Sends daily email and Telegram summaries.
- **API**: REST API for job management and user preferences.
- **Security**: Supabase Auth integration with RLS and JWT verification.

## Setup

1. **Install Dependencies**

   ```bash
   cd server
   yarn
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (for protecting fetch endpoint)
   - `SMTP_` config for emails
   - `TELEGRAM_BOT_TOKEN`

3. **Database**
   Run the migration SQL in your Supabase SQL Editor:
   - `migrations/001_init.sql`

## Running Locally

**Start Server:**

```bash
yarn start
# or
yarn dev
```

**Trigger Daily Fetch Manually:**

```bash
yarn fetch:daily
```

Or via API:

```bash
curl -X POST http://localhost:5000/api/v1/fetch/run \
  -H "cron_secret: dev_secret"
```

## Testing

Run unit tests:

```bash
yarn test
```

## Deployment (Render)

This repo is configured for [Render](https://render.com).

- Connect repository.
- Use `render.yaml` for blueprint or deploy as "Web Service" + "Cron Job".
- Set environment variables in dashboard.

## API Documentation

- `GET /api/v1/jobs`: List matched jobs.
- `POST /api/v1/jobs/seed`: Seeds the database with dummy job data for testing.
- `POST /api/v1/user_jobs/:job_id/mark`: Mark as applied/ignored.
- `GET/PUT /api/v1/users/me/preferences`: Manage preferences.

**Auth**: All user endpoints require `Authorization: Bearer <SUPABASE_JWT>`.
