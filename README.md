# Note — Collaborative Note-Taking App

A full-stack collaborative note-taking web app built with the **MERN stack** (MongoDB, Express, React, Node.js) and **Tailwind CSS**. Features JWT authentication, full-text search, collaborator management, and a rich text editor.

## Features

- **JWT authentication** — Register, login, and protected routes
- **Notes CRUD** — Create, read, update, and delete notes (delete only for owners)
- **Full-text search** — Search across note titles and content (MongoDB text index)
- **Collaborator management** — Note owners can add collaborators by email and remove them
- **Rich text editor** — Formatting (headings, bold, lists, links, code) via Quill
- **Tailwind CSS** — Responsive, utility-first styling

## Project structure

```
/
├── backend/          # Node.js + Express + MongoDB API
├── frontend/         # React (Vite) + Tailwind CSS SPA
├── README.md
└── .env.example      # Example env (see backend & frontend .env.example)
```

Backend and frontend are in separate folders and can be run independently.

## Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** (local instance or MongoDB Atlas connection string)

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example`:

| Variable      | Description                          |
|---------------|--------------------------------------|
| `PORT`        | Server port (default: 5000)          |
| `NODE_ENV`    | `development` or `production`        |
| `MONGODB_URI` | MongoDB connection string            |
| `JWT_SECRET`  | Secret key for signing JWT tokens   |

### Frontend (`frontend/.env`)

Copy from `frontend/.env.example`:

| Variable        | Description                                      |
|-----------------|--------------------------------------------------|
| `VITE_API_URL`  | Backend API URL (e.g. `http://localhost:5000`)   |

For local development with the default Vite proxy, you can leave `VITE_API_URL` unset or set it to `http://localhost:5000`.

## Setup

1. **Clone the repository** (or use this folder as your repo root).

2. **Backend**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and set MONGODB_URI and JWT_SECRET
   npm install
   npm run dev
   ```
   API runs at `http://localhost:5000`.

3. **Frontend**
   ```bash
   cd frontend
   cp .env.example .env
   # Optionally set VITE_API_URL if your API is elsewhere
   npm install
   npm run dev
   ```
   App runs at `http://localhost:3000` and proxies `/api` to the backend when using the default Vite config.

4. **Demo video**  
   Record a short demo covering: sign up, login, creating/editing a note, full-text search, and adding/removing a collaborator. Add the video file (e.g. `demo.mp4`) to the repo or link it in the README.

## Assumptions and notes

- **Collaborators** are added by **email**; the user must already have an account.
- **Full-text search** uses MongoDB’s `$text` index on the `notes` collection (title + content). The index is created by Mongoose from the schema.
- **Rich text** is stored as **HTML** in the `content` field (Quill’s default).
- **Delete note** is allowed only for the **owner**; collaborators can edit but not delete.
- **CORS** is enabled for all origins in development; restrict in production as needed.
- No real credentials are committed; use `.env` and `.env.example` only (add `.env` to `.gitignore`).

## API overview

- `POST /api/auth/register` — Register (name, email, password)
- `POST /api/auth/login` — Login (email, password)
- `GET /api/auth/me` — Current user (Bearer token)
- `GET /api/notes` — List notes (owned + shared)
- `GET /api/notes/search?q=...` — Full-text search
- `GET /api/notes/:id` — Get one note
- `POST /api/notes` — Create note
- `PUT /api/notes/:id` — Update note
- `DELETE /api/notes/:id` — Delete note (owner only)
- `POST /api/notes/:id/collaborators` — Add collaborator (body: `{ email }`)
- `DELETE /api/notes/:id/collaborators/:userId` — Remove collaborator (owner only)

## License

MIT
