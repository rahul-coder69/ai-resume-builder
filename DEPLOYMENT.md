# Deploy Backend (Render) + Frontend (Vercel/Netlify)

This project is split into:

- `server` for backend API (Render)
- `client` for frontend app (Vercel or Netlify)

## 1) Deploy Backend to Render (Option B - Manual Web Service)

1. Push your repository to GitHub.
2. In Render, click **New +** -> **Web Service**.
3. Connect/select this repository.
4. Fill these values:
   - **Name**: `resume-builder-api` (or any name you prefer)
   - **Runtime**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)
5. Click **Create Web Service**.

### Backend environment variables (Render)

Add these in Render -> Service -> Environment:

- `MONGODB_URI`
- `MONGO_URI` (optional fallback)
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL` (only if your OpenAI-compatible endpoint requires custom base URL)
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`
- `GOOGLE_CLIENT_ID`
- `RABBITMQ_URL` (recommended) or `RABBITMQ_HOST`/`RABBITMQ_PORT`/`RABBITMQ_USER`/`RABBITMQ_PASS`
- `REDIS_URL`
- `REDIS_ENABLED` (`true` by default)
- `CLIENT_URL1` (your Vercel URL, e.g. `https://your-site.vercel.app`)
- `CLIENT_URL2` (your Netlify URL, e.g. `https://your-site.netlify.app`)
- `CLIENT_URL` should not point to localhost in production, because verification emails now prefer `CLIENT_URL1` and `CLIENT_URL2` before falling back to `CLIENT_URL`
- `OTP_RATE_LIMIT_SECONDS` (optional, default `60`)
- `OTP_CACHE_SECONDS` (optional, default `600`)
- `EMAIL_QUEUE_NAME` (optional, default `email.jobs`)
- `EMAIL_RETRY_QUEUE_NAME` (optional, default `email.jobs.retry`)
- SMTP values for Mailtrap:
  - `SMTP_HOST=sandbox.smtp.mailtrap.io`
  - `SMTP_PORT=587`
  - `SMTP_SECURE=false`
  - `SMTP_USER=<mailtrap username>`
  - `SMTP_PASS=<mailtrap password>`
  - `SMTP_FROM=<sender email>`

Legacy fallback (optional):

- `CLIENT_URL` with comma-separated values, for example
  `https://site.vercel.app,https://site.netlify.app`

After deploy, copy your backend URL, for example:
`https://resume-builder-api.onrender.com`

## 2) Deploy Frontend to Vercel

1. In Vercel, click **Add New...** -> **Project**.
2. Import the same GitHub repository.
3. Set **Root Directory** to `client`.
4. Confirm build settings:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add frontend environment variables in Vercel -> Project Settings -> Environment Variables:
   - `VITE_BASE_URL` = your Render backend URL (example: `https://resume-builder-api.onrender.com`)
   - `VITE_GOOGLE_CLIENT_ID` = same Google client ID used by backend
6. Deploy.

## 3) Deploy Frontend to Netlify

1. In Netlify, click **Add new site** -> **Import an existing project**.
2. Import the same GitHub repository.
3. Netlify will use [netlify.toml](netlify.toml) from repo root.
4. Add frontend environment variables in Netlify -> Site configuration -> Environment variables:
   - `VITE_BASE_URL` = your Render backend URL
   - `VITE_GOOGLE_CLIENT_ID` = same Google client ID used by backend
5. Deploy.

## 4) Update Render CORS allowlist

When Vercel and Netlify give your final production URLs:

1. Go to Render backend env vars.
2. Set `CLIENT_URL1` to your Vercel domain.
3. Set `CLIENT_URL2` to your Netlify domain.
4. Redeploy backend.

## Optional: Ignore Option A

- `render.yaml` can stay in the repo, but you can ignore it if you are using this manual method.

## 5) Verify app

- Open frontend URL on Vercel.
- Open frontend URL on Netlify.
- Check backend health route in browser:
  - `https://your-render-app.onrender.com/health`
- Test login/register and resume save flows.

## 6) Common fixes

- 404 on refresh in frontend: `client/vercel.json` rewrite is required (already added).
- 404 on refresh in Netlify: root `netlify.toml` redirect is required (already added).
- CORS error: ensure `CLIENT_URL1` and `CLIENT_URL2` exactly match deployed domains.
- API calls failing: check `VITE_BASE_URL` in both Vercel and Netlify.
- Cold start on free Render plan: first API request may be slow.
