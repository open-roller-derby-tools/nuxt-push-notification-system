# Nuxt Push Notification System (POC)

A proof‑of‑concept push notification system built with **Nuxt 4**, **BullMQ**, **Redis**, and **Web Push**.  
This project demonstrates scheduled notifications, queue processing, VAPID‑based Web Push delivery, and a minimal admin interface to manage messages.

---

## Features

- Web Push notifications (VAPID)
- Scheduled notifications using BullMQ
- Redis‑backed job queues
- Admin UI to create and manage notifications
- Bull board to monitor jobs
- PostgreSQL schema for storing subscriptions
- Docker Compose environment for Redis & tooling
- Nuxt 4 development environment

---

## Requirements

Before running the project, ensure you have:

- **Node.js 18+**
- **pnpm** or **npm**
- **Docker & Docker Compose**
- **PostgreSQL client** (psql)
- **Redis client** (redis-cli) — optional but recommended

---

## Architecture overview

```
Browser  →  Nuxt API  →  PostgreSQL
   ↑            ↓
Service Worker ← Web Push ← Worker (BullMQ) ← Redis
```

---

## Running the Infrastructure (Docker Compose)

The project includes a `docker-compose.yml` file providing:

- Redis (for BullMQ)
- PostgreSQL

Start the stack:

```bash
docker compose up -d
```

## Database schema

Use `psql -h localhost -U dev -d poc` to create tables and indexes (schema.sql)

## Generating VAPID Keys

The push notification system requires a VAPID key pair. Generate them with:

`npx web-push generate-vapid-keys`

Create a .env file and copy VAPID keys:

```bash
VAPID_PUBLIC_KEY=<your_public_key>
VAPID_PRIVATE_KEY=<your_private_key>
```

## Run the project

1. Install dependencies:

  `pnpm install`

2. Start Nuxt in development mode:

`pnpm dev`

3. Check Bull board on http://localhost:3030/admin/queues (optional)
  