# Simple RPG Cards

Create, manage, and print RPG cards and statblocks.

## Overview

Full‑stack TypeScript app with a dark UI and fast local setup.

## Features

- Cards
	- CRUD (title, front/back text, tags)
	- Search/filter by content and tags; bulk select
	- Generate print‑ready PDFs (single or multiple)

- Statblocks
	- Edit mode: compact editor for abilities, spells, attacks, tags, notes
	- View mode: dense, responsive list with URL‑persisted search
	- Dice links in view mode (e.g., `6d12`, `1d4+2`) → dialog shows rolls, modifiers, total
	- Bulk tag add/remove with a quick‑pick list of existing tags

- UI/Infra
	- Dark theme via Angular Material
	- SQLite storage with TypeORM

## Stack

- Frontend: Angular 20, Angular Material
- Backend: Node.js, Express, TypeORM, SQLite
- PDF: PDFKit custom layouts

## Prerequisites

- Node.js 18+

## Setup

```bash
# from repo root
npm run install:all
```

## Run (development)

Use two terminals:

```bash
# backend
npm run dev:backend

# frontend
npm run dev:frontend
```

Default URLs:
- Backend: http://localhost:3000
- Frontend: http://localhost:4200

## Build

```bash
npm run build:backend
npm run build:frontend
```

## Start (production‑style)

```bash
npm run start:backend
npm run start:frontend
```

## Configuration

Backend environment variables (defaults in code):
- `SRC_HOST` (default: `localhost`)
- `SRC_PORT` (default: `3000`)
- `SRC_DATABASE_PATH` (default: `./rpg_cards.db`)
- `NODE_ENV` (`production` | `development`)

Frontend environments:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

## Project structure (brief)

```
backend/    Node + Express + TypeORM + SQLite
frontend/   Angular 20 + Material
```

## License

AGPLv3 (GNU Affero General Public License v3.0). See `LICENSE.txt` for the full text.

