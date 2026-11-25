# Deploying Kyron 2.0 to Render as a Web Service

Kyron 2.0 is configured for zero-friction deployment on [Render](https://render.com) as a single containerized Web Service (Free or Starter tier), orchestrating the React SOC Console, the Go MCP Protocol Gateway, and the Python Control Plane API.

---

## Architecture on Render

When deployed as a Render Web Service, a single unified container runs:
1. **Public Web Server (Nginx)**: Listens on `${PORT}` (dynamically set by Render, e.g. `10000`) and serves the compiled React SPA.
2. **Control Plane API (FastAPI)**: Runs internally on `127.0.0.1:8001`, handling tool governance, authorization leases, Article 50 dossier generation, and OAuth handshakes. Proxied via `/v1/`, `/impact`, and `/healthz`.
3. **Protocol Gateway (Go)**: Runs internally on `127.0.0.1:8080`, handling in-flight MCP tool calls and SSE streams. Proxied via `/sse` and `/message`.
4. **Database**: Connects to any PostgreSQL instance via `DATABASE_URL` (e.g. Render PostgreSQL). If no `DATABASE_URL` is set, an in-memory SQLite store initializes automatically for instant demos.

---

## Method 1: Deploy as a Standard Web Service (Quickest)

1. Log into your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`Kyron_2.0`).
4. Configure the service settings:
   - **Name**: `kyron-web` (or any name you choose)
   - **Region**: Oregon (or closest to you)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (default)
   - **Plan**: `Free` or `Starter`
5. *(Optional)* In the **Environment Variables** section, add:
   | Key | Value / Source | Description |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...` | Connection string to Render Postgres or external DB |
   | `SECRET_KEY` | *(Random 32-char string)* | Session and JWT signing key |
   | `GOOGLE_CLIENT_ID` | `your-google-client-id` | Google OAuth 2.0 Client ID |
   | `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | Google OAuth 2.0 Secret |
   | `GITHUB_CLIENT_ID` | `your-github-client-id` | GitHub OAuth Client ID |
   | `GITHUB_CLIENT_SECRET` | `your-github-client-secret` | GitHub OAuth Secret |
6. Click **Deploy Web Service**.

Render will automatically run the multi-stage build and launch your live application at `https://<your-service-name>.onrender.com`.

---

## Method 2: Deploy via Render Blueprint (`render.yaml`)

Kyron includes a root `render.yaml` specification that provisions both the Web Service and a managed PostgreSQL database together:

1. In Render Dashboard, click **New +** → **Blueprint**.
2. Connect your `Kyron_2.0` repository.
3. Render will read `render.yaml` and display the resources to create:
   - **`kyron-web`**: The unified Docker Web Service.
   - **`kyron-db`**: A managed PostgreSQL database.
4. Click **Apply**.
5. Once deployed, `DATABASE_URL` is automatically linked from `kyron-db` to `kyron-web`.

---

## Configuring OAuth Callback URLs for Render

After Render assigns your public domain (e.g., `https://kyron-web.onrender.com`):

1. **Google Cloud Console** (APIs & Services → Credentials → OAuth 2.0 Client IDs):
   - Add Authorized Redirect URI:
     ```text
     https://<your-service-name>.onrender.com/v1/auth/google/callback
     ```
2. **GitHub Developer Settings** (Settings → Developer Settings → OAuth Apps):
   - Add Authorization Callback URL:
     ```text
     https://<your-service-name>.onrender.com/v1/auth/github/callback
     ```

---

## Health Check and Verification

Render will automatically probe `/healthz` on the assigned port. You can verify your live instance anytime:

```bash
# Health probe (returns status, uptime, checks)
curl https://<your-service-name>.onrender.com/healthz

# Auth provider status
curl https://<your-service-name>.onrender.com/v1/auth/providers
```
