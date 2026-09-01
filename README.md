# TrustLayer

TrustLayer is a web application for creating and verifying digital product passports for high-value resale goods. It helps sellers publish structured product records and gives buyers a simple way to review authenticity signals, ownership information, warranty details, condition, and product history before purchasing.

The application currently supports a complete frontend demo flow and can optionally persist passport data in Supabase. When Supabase is not configured, TrustLayer automatically uses local mock data.

## Features

- Create digital passports with protected or masked product identifiers.
- Manage passports from a seller dashboard.
- Verify a passport using its ID or public URL.
- View buyer-facing public passport pages.
- Track product attributes, history, warranty, verification, and QR readiness.
- Store published passports in Supabase with Row Level Security policies.
- Continue using the demo experience without a configured backend.
- Responsive interface built for desktop and mobile devices.

## Current project status

TrustLayer is an early-stage product prototype. Passport creation, dashboard management, public pages, and verification flows are available. The following capabilities are represented in the interface but are planned for a later release:

- Solana certificate minting
- Downloadable QR codes
- Production seller authentication and onboarding
- Wallet ownership and transfer flows
- Payments, escrow, and Solana Pay integration

## Tech stack

- React 19 and TypeScript
- TanStack Start, Router, and Query
- Vite 7
- Tailwind CSS 4
- Supabase
- Radix UI primitives
- Motion for React
- Cloudflare runtime adapter

## Getting started

### Prerequisites

- Node.js `20.19+` or `22.12+`
- npm
- A Supabase project if you want persistent backend data

### Installation

```bash
git clone https://github.com/Rully2212/TrustLayer.git
cd TrustLayer
npm install
```

Create the local environment file:

```bash
cp .env.example .env
```

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal.

## Environment variables

TrustLayer reads the following variables from `.env`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

The `.env` file is ignored by Git. Keep private or service-role credentials out of all `VITE_*` variables because Vite exposes them to browser code.

If these variables are missing, the app remains usable with its built-in mock passport data.

## Supabase setup

1. Create a Supabase project.
2. Open the Supabase SQL Editor.
3. Run [`supabase/migrations/20260523000000_initial_trustlayer_schema.sql`](supabase/migrations/20260523000000_initial_trustlayer_schema.sql).
4. Add your project URL and anon key to `.env`.
5. Restart the development server.

The migration creates profiles, sellers, passports, passport attributes, history, and reports. It also enables Row Level Security for seller-owned records and public access to explicitly published passports.

## Available scripts

| Command             | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the local development server   |
| `npm run build`     | Create a production build            |
| `npm run build:dev` | Create a development-mode build      |
| `npm run preview`   | Preview the production build locally |
| `npm run lint`      | Run ESLint                           |
| `npm run format`    | Format the project with Prettier     |

## Main routes

| Route              | Purpose                    |
| ------------------ | -------------------------- |
| `/`                | Product landing page       |
| `/dashboard`       | Seller passport dashboard  |
| `/create-passport` | Passport creation workflow |
| `/verify`          | Buyer verification tool    |
| `/passport/:id`    | Public product passport    |
| `/seller-access`   | Seller access screen       |

## Project structure

```text
src/
├── components/ui/       Reusable UI components
├── hooks/               React hooks
├── lib/                 Supabase client, data access, types, and mock data
├── routes/              File-based application routes
├── router.tsx           Router configuration
└── styles.css           Global styles and theme

supabase/
└── migrations/          Database schema and security policies
```

## Production checks

Before deploying a change, run:

```bash
npm run lint
npm run build
```

## Repository

Maintained by [Rully2212](https://github.com/Rully2212).
