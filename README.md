# Playground — AI Mini-App Creation Platform

Playground is an AI-powered sandbox and community platform where users build, test, verify, and remix interactive web mini-apps in real-time using **Gemini 3.5 Flash Lite**.

---

## Architecture

The project is decoupled into two independent layers:

1. **Static Frontend (`/out`)**:
   - Built with Next.js (App Router with `output: 'export'`), Tailwind CSS, and Lucide Icons.
   - Deploys as a 100% static Single Page Application (SPA) to **GitHub Pages**.
   - Includes custom SPA redirection in `404.html` and `layout.tsx` to ensure deep URLs (`/explore/`, `/create/`, `/app/view/?id=...`) work seamlessly on hard refresh.
   - Communicates with the backend using JWT Bearer authentication (`Authorization: Bearer <token>`) stored in `localStorage` (avoids cross-origin third-party cookie blocking).

2. **Standalone Backend (`server.ts`)**:
   - Express server with CORS configured for `localhost` and `*.github.io`.
   - Streaming AI endpoints: `/api/generate` and `/api/repair` powered by `@google/genai` with `gemini-3.5-flash-lite`.
   - SQLite persistence via Prisma with real UGC (Zero fake data).
   - JWT authentication: `/api/auth/signup`, `/api/auth/login`, `/api/auth/me`.
   - App CRUD & remixing: `/api/apps`, `/api/apps/my`, `/api/apps/:id`, `/api/apps/:id/fork`.

---

## Local Development

### 1. Install Dependencies
```bash
pnpm install
pnpm prisma generate
```

### 2. Configure Environment Variables
Create `.env.local`:
```env
# Server
PORT=3001
JWT_SECRET=your_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash-lite

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Start Backend Server
```bash
pnpm server
# or auto-reload on file changes:
pnpm dev:server
```

### 4. Start Frontend
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Deploying to GitHub Pages (Frontend)

1. **Push to GitHub**:
   Ensure your repository is pushed to GitHub on the `main` branch.

2. **Enable GitHub Pages**:
   - In your GitHub repository, go to **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.

3. **Configure Environment Secrets/Variables (Optional)**:
   - Go to **Settings** → **Secrets and variables** → **Actions**.
   - Add a repository variable or secret:
     - `NEXT_PUBLIC_API_URL`: The public HTTPS URL of your deployed backend (e.g. `https://playground-backend.onrender.com`).
     - `NEXT_PUBLIC_BASE_PATH`: (Optional) If your repository is at `https://<username>.github.io/<repo>`, this is automatically set to `/<repo>` by the included workflow.

4. **Automatic Deployment**:
   - The included `.github/workflows/deploy.yml` will automatically build the static export and deploy to GitHub Pages on every push to `main`.

---

## Free Hosting for the Backend Server

You can host `server.ts` for free on several platforms:

### Option A: Render.com (Recommended Free Web Service)
1. Sign up at [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository.
4. Set the following options:
   - **Environment**: `Node` (or `Docker` using the included `Dockerfile`)
   - **Build Command**: `pnpm install && pnpm prisma generate`
   - **Start Command**: `pnpm server`
5. Add Environment Variables:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `GEMINI_MODEL`: `gemini-3.5-flash-lite`
   - `JWT_SECRET`: Any random 32-character string
   - `PORT`: `10000` (Render's default)
   - `DATABASE_URL`: `file:./dev.db` (or a free PostgreSQL database URL)
6. Copy the assigned URL (e.g. `https://playground-api.onrender.com`) and set it as `NEXT_PUBLIC_API_URL` in your GitHub repository variables for GitHub Pages!

### Option B: Fly.io (Free Tier Docker)
```bash
fly launch
fly secrets set GEMINI_API_KEY=your_key JWT_SECRET=your_secret
fly deploy
```

### Option C: Railway or Koyeb
Both support the included `Dockerfile` directly with persistent volumes or PostgreSQL integration.
