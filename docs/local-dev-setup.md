# Running PreGate Locally — Developer Setup Guide

This guide walks you through setting up the PreGate project on your own computer for development.
No prior experience required — every step is explained.

---

## What You Will Be Running

PreGate has three parts that all need to be running at the same time:

| Part | Technology | What it does |
|------|-----------|--------------|
| **UI** | React (Vite) | The web interface users see in their browser |
| **API** | Node.js + Express | The backend server that handles logic and data |
| **Database** | PostgreSQL | Stores all the data (surveys, responses, etc.) |

The API and Database run inside **Docker containers** (isolated boxes on your machine).
The UI runs directly on your machine using **Node.js**.

---

## Step 1 — Install the Prerequisites

You need to install three tools before anything else.

### 1a. Node.js

Node.js lets you run JavaScript on your computer (outside a browser). It also includes `npm`, the package manager used to install project dependencies.

- Download from: https://nodejs.org — pick the **LTS** version (Long Term Support — more stable)
- Install it and follow the prompts

Verify it worked — open a terminal and run:
```bash
node --version   # should print something like v20.x.x
npm --version    # should print something like 10.x.x
```

> **What is Node.js?** Normally JavaScript only runs inside browsers. Node.js lets you run it anywhere — on servers, on your laptop, etc. The API in this project is built with Node.js.

### 1b. Docker Desktop

Docker lets you run apps inside isolated containers, so you don't need to install PostgreSQL directly on your machine.

- Download from: https://www.docker.com/products/docker-desktop/
- Install and **start Docker Desktop** (you need it running in the background)

Verify it worked:
```bash
docker --version          # should print Docker version x.x.x
docker compose version    # should print Docker Compose version x.x.x
```

> **What is Docker?** Think of a container like a mini computer inside your computer. It has its own OS, software, and settings — completely isolated. This means the database runs the same way on every developer's machine, regardless of their OS.

### 1c. A PostgreSQL Client (optional but recommended)

This lets you peek inside the database directly. A good free option is **TablePlus** or **DBeaver**.

- TablePlus: https://tableplus.com (free tier is sufficient)
- DBeaver: https://dbeaver.io (fully free)

You do not need this to run the app — it is just useful for debugging.

---

## Step 2 — Get the Code

Clone the repository (download the code to your machine):

```bash
git clone <repository-url>
cd PreGate
```

Replace `<repository-url>` with the actual Git URL for this project.

> **What is Git?** Git is a version control system. It tracks every change ever made to the code, lets you collaborate with others, and lets you go back in time if something breaks.

---

## Step 3 — Install Dependencies

Each part of the project (API and UI) has its own list of packages it needs. Install them:

```bash
# Install API dependencies
cd api
npm install

# Install UI dependencies
cd ../ui
npm install

# Go back to the project root
cd ..
```

> **What does `npm install` do?** It reads the `package.json` file (a list of required packages) and downloads all of them into a folder called `node_modules`. You never edit `node_modules` — it is managed by npm.

---

## Step 4 — Start the API and Database (via Docker)

From the project root folder, run:

```bash
docker compose up -d
```

- `-d` means "detached" — the containers run in the background so your terminal stays free
- This starts two containers: **PostgreSQL** (database) and the **API** (Node.js server)
- First time may take a minute to download the Docker images

Check that both containers are running:
```bash
docker compose ps
```

You should see `pregate-postgres` and `pregate-api` with a status of `running`.

> **What is `docker compose`?** The `docker-compose.yml` file in the project root describes all the containers needed. `docker compose up` reads that file and starts everything automatically.

---

## Step 5 — Run Database Migrations

Migrations are SQL scripts that create the database tables and initial data. You only need to do this once (or after a reset).

```bash
cd db
chmod +x migrate.sh     # makes the script executable (macOS/Linux only)
./migrate.sh
cd ..
```

On Windows, you may need to run the SQL files manually using your PostgreSQL client, or use WSL (Windows Subsystem for Linux).

> **What is a migration?** A migration is a script that modifies the database structure (creates tables, adds columns, etc.). Running them in order builds the full database schema from scratch.

---

## Step 6 — Start the UI

```bash
cd ui
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

Leave this terminal running — the UI server needs to stay open.

> **What is Vite?** Vite is a build tool for React. In development mode, it serves your React app instantly and automatically reloads the browser whenever you change a file.

---

## You Are Done — Check Everything Works

Open your browser and visit these URLs:

| URL | What you should see |
|-----|-------------------|
| http://localhost:5173 | The PreGate UI (main web app) |
| http://localhost:3000/health | `{"status":"ok"}` — API is running |
| http://localhost:5173/admin | Admin login panel |

---

## Stopping Everything

When you are done working, stop the services:

```bash
# Stop the UI: press Ctrl+C in the terminal where `npm run dev` is running

# Stop the Docker containers (API + database)
docker compose down
```

> Use `docker compose down` to stop containers but keep the database data.
> Use `docker compose down -v` to also **delete** all database data (useful for a clean reset).

---

## Starting Again Next Time

The next time you work on the project you only need:

```bash
# 1. Start Docker containers (from project root)
docker compose up -d

# 2. Start the UI (from ui/ folder)
cd ui && npm run dev
```

You do not need to re-run `npm install` or migrations unless something changed.

---

## Troubleshooting

**`docker compose up` fails with "port already in use"**
Something else on your machine is using port 3000 or 5432. Find and stop it, or change the port in `docker-compose.yml`.

**`npm install` fails**
Make sure Node.js is installed correctly. Try deleting the `node_modules` folder and running `npm install` again.

**UI shows a blank page or network error**
Make sure the API container is running (`docker compose ps`) and try http://localhost:3000/health.

**Database migration fails**
Make sure the Postgres container is healthy before running migrations. Wait a few seconds after `docker compose up` and try again.

---

## Learning Resources

Since you are new to these technologies, here are the best places to learn:

### Node.js
- [Node.js official "Getting Started" guide](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) — short and clear
- [The Odin Project — NodeJS path](https://www.theodinproject.com/paths/full-stack-javascript) — free, project-based

### React
- [react.dev](https://react.dev/learn) — the official React docs, excellent for beginners
- Start with the **"Quick Start"** and **"Tutorial: Tic-Tac-Toe"** sections

### Docker
- [Docker "Getting Started" tutorial](https://docs.docker.com/get-started/) — interactive, step by step
- Key concepts to understand first: **images**, **containers**, and **volumes**

### TypeScript (used in this project for both API and UI)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) — official, beginner-friendly
- TypeScript is JavaScript with types added — it catches bugs before you run the code

### PostgreSQL (the database)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com) — practical, example-driven

> **Tip:** You do not need to master all of these before contributing. Start by reading the React docs and playing with the UI. The Docker containers handle the backend for you automatically.
