# Vigil — Deadline & Compliance Intelligence

> Never miss a critical deadline again. Vigil consolidates all your expiring items — licenses, certifications, contracts, subscriptions, warranties, and more — into a single intelligent command center.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57.svg)

## The Problem

Every organization juggles dozens of critical deadlines across completely different categories:

- **Business licenses** that expire and trigger costly penalties
- **Insurance policies** that lapse and leave you exposed
- **Vendor contracts** that auto-renew at unfavorable terms
- **Employee certifications** that expire and create compliance violations
- **SSL certificates** and **domain names** that lapse and break production
- **SaaS subscriptions** that silently drain your budget
- **Lease agreements**, **warranties**, **permits**, **vehicle registrations**...

These items live in spreadsheets, email threads, sticky notes, and the memories of individual employees. When something slips through the cracks, the consequences range from annoying (broken website) to catastrophic (uninsured liability, regulatory fines).

## The Solution

Vigil is a **self-hosted, local-first web application** that gives you:

- **Unified tracking** of every type of expiring item in one place
- **Risk-based prioritization** that surfaces what needs attention NOW
- **Intelligent alerting** with configurable rules per category
- **Document attachment** — keep contracts/certificates alongside their tracking record
- **Activity audit trail** — know who changed what and when
- **Import/Export** — easy migration from spreadsheets
- **Zero external dependencies** — runs entirely on your machine with SQLite

## Quick Start

```bash
# Clone or download the project
cd vigil

# Install and start the backend
cd server
npm install
npm run dev

# In another terminal, install and start the frontend
cd client
npm install
npm run dev
```

Open http://localhost:5173 — the app comes pre-loaded with realistic demo data.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts |
| Backend | Node.js, Express.js, TypeScript |
| Database | SQLite (via better-sqlite3) — zero configuration |
| Icons | Lucide React |

## Architecture

```
┌─────────────────────────────────────────┐
│           React Frontend (5173)          │
│  Dashboard │ Items │ Categories │ Alerts │
└──────────────────┬──────────────────────┘
                   │ REST API
┌──────────────────┴──────────────────────┐
│          Express Backend (3001)          │
│  Routes → Services → Risk Engine        │
└──────────────────┬──────────────────────┘
                   │ better-sqlite3 (sync)
┌──────────────────┴──────────────────────┐
│         SQLite Database (WAL mode)       │
│  items │ categories │ documents │ alerts │
└─────────────────────────────────────────┘
```

## Features

### Dashboard
- At-a-glance stats: total items, expiring soon, expired, monthly costs
- Risk timeline showing upcoming deadlines
- Category and risk distribution charts
- Recent activity feed

### Item Management
- Full CRUD with rich metadata (dates, costs, vendor, responsible person)
- Table and card views with search, filter, and sort
- Bulk operations (delete, archive, status change)
- Document attachment and download
- Activity history per item

### Risk Engine
- Automatic risk scoring (0-100) based on:
  - Days until expiry
  - Financial impact (cost)
  - Category default risk level
  - Manual risk override
- Items < 7 days from expiry are automatically flagged critical

### Alert Rules
- Configurable alert rules per category or globally
- Set notification triggers at 90, 60, 30, 14, 7, 3, 1 days before expiry
- Multiple notification channels (in-app, email, webhook)

### Import/Export
- Import from CSV or JSON
- Export your complete data for backup or migration

## Configuration

The application uses sensible defaults and requires no configuration to run. Optional environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend API port |
| `DATA_DIR` | `./data` | Directory for SQLite DB and uploads |

## License

MIT — use it however you want.

## Attribution

Built with open-source technologies:
- [Express.js](https://expressjs.com/) — MIT License
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — MIT License
- [React](https://react.dev/) — MIT License
- [Vite](https://vitejs.dev/) — MIT License
- [Tailwind CSS](https://tailwindcss.com/) — MIT License
- [TanStack Query](https://tanstack.com/query) — MIT License
- [Recharts](https://recharts.org/) — MIT License
- [Lucide Icons](https://lucide.dev/) — ISC License
- [date-fns](https://date-fns.org/) — MIT License
