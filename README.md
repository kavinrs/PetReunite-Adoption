# Pet Adoption & Rescue – Chat Feature Scaffold

This repository includes a scaffold for a **Pet Adoption & Rescue chat feature** using:

- **Backend (server/)**: Django, Django REST Framework, SimpleJWT, Django Channels, Redis channel layer, PostgreSQL.
- **Frontend (client/)**: React + TypeScript (Vite), axios, native WebSocket API, React Router.

The existing project code (e.g. `Backend/`, `frontend/`) remains unchanged. The chat system is a **new, self-contained server/client pair** under `server/` and `client/`.

---

## Project Layout

Planned structure for the chat feature:

- `server/`
  - Django project (ASGI, Channels, REST API)
  - `chat` app with rooms, members, messages, audit logs
  - JWT auth (REST + WebSocket handshake)
  - Management command to create a test admin
- `client/`
  - Vite React + TypeScript SPA
  - Auth pages (login/register)
  - Room list and room detail chat view
  - Admin room creation + member management UI

> **Note:** This README describes the chat scaffold we are building step‑by‑step. Some folders and files may not exist yet if you are reading this before all steps are completed.

---

## Environment Variables (Overview)

You will have **two `.env` files**:

- `server/.env` (backend)
  - `DJANGO_SECRET_KEY`
  - `DEBUG`
  - `DATABASE_URL` (PostgreSQL)
  - `REDIS_URL`
  - `SIMPLE_JWT_ACCESS_TOKEN_LIFETIME_DAYS`
  - `ALLOWED_HOSTS`
  - `PORT`
- `client/.env` (frontend)
  - `VITE_API_BASE`
  - `VITE_WS_BASE`

Concrete examples will be in `server/.env.example` and `client/.env.example`.

> **Never commit real secrets.** Only commit the `*.env.example` files.

---

## Basic Backend Workflow (Once Scaffold Is Complete)

From the repository root:

```bash
# 1) Create and activate a virtual environment (recommended path)
python -m venv .venv

# Windows PowerShell
. .venv/Scripts/Activate.ps1

# 2) Install backend dependencies (will be defined in server/requirements.txt)
pip install -r server/requirements.txt

# 3) Copy env example and edit values
copy server/.env.example server/.env
# Edit server/.env to set DJANGO_SECRET_KEY, DATABASE_URL, REDIS_URL, etc.

# 4) Apply database migrations (after Django project is generated)
cd server
python manage.py migrate

# 5) (Optional) Create a test admin user
python manage.py create_test_admin

# 6) Run the development server (ASGI/Channels)
python manage.py runserver 0.0.0.0:8000
```

In production, you’ll use an ASGI server like **Daphne** or **Uvicorn** instead of `runserver`.

---

## Basic Frontend Workflow (Once Scaffold Is Complete)

From the repository root:

```bash
cd client

# 1) Install dependencies
npm install

# 2) Copy env example and edit values
copy .env.example .env
# Ensure VITE_API_BASE and VITE_WS_BASE match your backend

# 3) Start the Vite dev server
npm run dev
```

The default frontend origin will be `http://localhost:5173` and the backend API at `http://localhost:8000/api` (configurable via env).

---

## Git Ignore Recommendations

Your existing `.gitignore` file is kept as‑is. For the chat scaffold, ensure the following are **ignored** (add them manually if not already present):

```gitignore
# Python virtualenvs
.venv/
venv/

# Node modules
node_modules/

# Environment files
.env
*.env
server/.env
client/.env

# Build artifacts
server/staticfiles/
client/dist/

# Python cache
__pycache__/
*.py[cod]

# IDE/editor
.vscode/
.idea/
*.log
```

---

## Next Steps (Planned Scaffold)

The remaining steps we will implement **one by one**:

1. **Server env & setup**
   - `server/.env.example`
   - `server/requirements.txt`
2. **Django project & app**
   - ASGI/Channels config, REST framework, CORS, JWT
3. **Chat models & migrations**
   - `ChatRoom`, `ChatRoomMember`, `Message`, `AuditLog`
4. **Serializers, permissions, and REST endpoints**
5. **Channels consumer & WebSocket routing**
6. **Tests and sanity checks**
7. **Client scaffold (Vite React TS)**
8. **Client pages, services, and WebSocket integration**
9. **Sanity report and example curl/WebSocket flows**

HI hello okay bye

