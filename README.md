# Stock Management System

A multi-location inventory management system built with **Nuxt 4**. Replaces Excel-based workflows with a modern web application featuring real-time stock tracking, inter-location transfers, weighted average costing (WAC), and coordinated period-end close across multiple sites.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Project Structure](#project-structure)
- [Documentation](#documentation)
- [Deployment](#deployment)
- [Support](#support)

## Project Overview

This Stock Management System is a full-stack web application designed to manage inventory across multiple physical locations (Kitchen, Store, Central Warehouse). It provides real-time stock tracking, automated weighted average cost calculations, and comprehensive period-end reconciliation workflows.

**Key Business Processes:**

- **Stock Transactions**: Deliveries (goods receipts), Issues (stock consumption), and Transfers (inter-location movements)
- **Cost Control**: Weighted Average Costing (WAC) automatically calculated per location on each delivery
- **Period Management**: Monthly accounting periods with coordinated close across all locations
- **Quality Control**: Automatic NCR (Non-Conformance Report) generation for price variances
- **Approval Workflows**: Multi-level approval for transfers, purchase requests, and period close

**Target Users:**

- **Operators**: Post daily transactions (deliveries, issues), view stock levels
- **Supervisors**: Approve transfers and PRF/PO, manage reconciliations
- **Admins**: Manage items and prices, close periods, configure system settings

## Key Features

- **Multi-Location Management** - Kitchen, Store, Central, and Warehouse locations with independent stock levels
- **Weighted Average Costing (WAC)** - Automatic calculation per location, updated on deliveries
- **Period Management** - Monthly accounting periods with coordinated close across all locations
- **Price Variance Detection** - Automatic NCR generation when delivery prices differ from locked period prices
- **Approval Workflows** - PRF/PO and Transfers require Supervisor approval; Period Close requires Admin approval
- **PWA Support** - Installable app with offline awareness

## Tech Stack

- **Framework:** Nuxt 4 (SPA mode)
- **UI Library:** Nuxt UI with Tailwind CSS v4
- **State Management:** Pinia
- **Database:** PostgreSQL 15+ via Supabase
- **ORM:** Prisma
- **Auth:** nuxt-auth-utils with JWT
- **Deployment:** Vercel (frontend + API), Supabase (database)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher
- **pnpm** 8.x or higher (required, not npm or yarn)
- **Git**

## Quick Start

Get the application running in 5 minutes:

```bash
# 1. Clone the repository
git clone <repository-url>
cd stock-management-system

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# 4. Start development server
pnpm dev

# 5. Open browser to http://localhost:3000
```

## Environment Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd stock-management-system
```

### 2. Configure Environment Variables

The application requires several environment variables to run. Follow these steps:

#### Copy the Environment Template

```bash
cp .env.example .env
```

#### Configure Required Variables

Open `.env` and update the following variables:

##### Database Configuration

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Get this from your Supabase project:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Project Settings > Database**
4. Copy the **Connection String > URI**

##### Supabase Configuration

```bash
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"
```

Get these from your Supabase project:

1. Go to **Project Settings > API**
2. Copy the **Project URL** (SUPABASE_URL)
3. Copy the **anon/public key** (SUPABASE_ANON_KEY)
4. Copy the **service_role key** (SUPABASE_SERVICE_KEY) - **Keep this secret!**

##### Authentication Secret

Generate a secure random string for JWT signing:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Or using OpenSSL
openssl rand -base64 32
```

Copy the output and set it as:

```bash
AUTH_SECRET="your-generated-secret-here"
```

##### Application Configuration

```bash
NUXT_PUBLIC_SITE_URL="http://localhost:3000"
NUXT_PUBLIC_CURRENCY="SAR"
```

For local development, use `http://localhost:3000`. For production, use your Vercel deployment URL.

### 3. Install Dependencies

**Important:** This project uses **pnpm** as the package manager. Do not use npm or yarn.

```bash
pnpm install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Development

### Development Workflow

This project follows a feature-branch workflow with comprehensive type checking and testing:

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Changes**
   - Schema changes: Edit `prisma/schema.prisma` → Run `pnpm db:push` (dev) or `pnpm db:migrate dev` (with history)
   - API routes: Create in `server/api/` using `defineEventHandler`
   - Composables: Create in `app/composables/` (auto-imported)
   - Components: Create in `app/components/` (auto-imported with path-based naming)
   - Pages: Create in `app/pages/` (auto-routed)

3. **Type Checking** (Required before commit)

   ```bash
   pnpm typecheck
   ```

   Must show **zero errors**. All code must be properly typed with no `any` types.

4. **Code Formatting** (Automatic with Prettier)

   ```bash
   pnpm format        # Format all files
   pnpm format:check  # Check formatting (CI)
   ```

   Files are auto-formatted on save in VS Code. Follow these rules:
   - Semicolons: Always use `;`
   - Quotes: Always use double quotes `"`
   - Indentation: 2 spaces
   - Line width: 100 characters max

5. **Testing** (When applicable)

   ```bash
   pnpm test:unit     # Unit tests (WAC, reconciliation, validation)
   pnpm test:api      # API integration tests
   pnpm test          # All tests
   ```

6. **Commit & Push**

   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

7. **Deploy Preview**
   - Push to GitHub triggers automatic Vercel preview deployment
   - Test on preview URL before merging

8. **Merge to Main**
   - Create pull request
   - After approval, merge to `main`
   - Auto-deploys to production

### Available Commands

```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Type checking (REQUIRED before commit)
pnpm typecheck

# Code formatting
pnpm format        # Format all files
pnpm format:check  # Check formatting

# Build for production
pnpm build

# Preview production build
pnpm preview

# Linting
pnpm lint

# Testing
pnpm test:unit     # Unit tests
pnpm test:api      # API tests
pnpm test          # All tests
```

### Database Commands

The database uses PostgreSQL 15+ via Supabase, accessed through Prisma ORM.

```bash
# Development: Push schema changes (no migration history)
pnpm db:push

# Development: Create migration with history
pnpm db:migrate dev

# Production: Deploy migrations
pnpm db:migrate deploy

# Open Prisma Studio (database GUI)
pnpm db:studio

# Generate Prisma Client (auto-runs after npm install)
pnpm prisma generate
```

**Important Notes:**

- **Development**: Use `db:push` for rapid prototyping or `db:migrate dev` when you want migration history
- **Production**: Always use `db:migrate deploy` - never use `db:push` in production
- **After schema changes**: Run `pnpm typecheck` to ensure generated types are correct

## Project Structure

```
├── app/
│   ├── assets/css/       # Tailwind CSS and global styles
│   └── ...
├── components/           # Vue components
├── composables/          # Vue composables
├── pages/               # Nuxt pages (auto-routing)
├── server/              # Backend API routes
│   ├── api/            # API endpoints
│   ├── middleware/     # Server middleware
│   └── utils/          # Server utilities
├── stores/              # Pinia stores
├── types/               # TypeScript types
├── prisma/              # Database schema (to be added)
├── project-docs/        # Project documentation
└── public/              # Static assets
```

## Documentation

### Developer Documentation

- **[API_ENDPOINTS.md](project-docs/API_ENDPOINTS.md)** - Complete API reference with request/response examples
- **[DATABASE_SCHEMA.md](project-docs/DATABASE_SCHEMA.md)** - Database schema documentation and ERD
- **[ENVIRONMENT_VARIABLES.md](project-docs/ENVIRONMENT_VARIABLES.md)** - Environment configuration guide
- **[DEPLOYMENT.md](project-docs/DEPLOYMENT.md)** - Deployment guide for Vercel and Supabase
- **[CLAUDE.md](CLAUDE.md)** - Development guidelines and best practices

### Product Documentation

- **[PRD.md](project-docs/PRD.md)** - Product Requirements Document
- **[MVP.md](project-docs/MVP.md)** - MVP scope and features
- **[System_Design.md](project-docs/System_Design.md)** - System architecture and design
- **[Workflow_Guide.md](project-docs/Workflow_Guide.md)** - Business workflows and processes
- **[UI_DESIGN_GUIDE.md](project-docs/UI_DESIGN_GUIDE.md)** - Design system and UI guidelines
- **[Roles_Permissions.md](project-docs/Roles_Permissions.md)** - User roles and permissions

### Development Tracking

- **[MVP_DEVELOPMENT_TASKS_PHASE4.md](project-docs/dev-phases/MVP_DEVELOPMENT_TASKS_PHASE4.md)** - Phase 4 task checklist
- **[TASK_COMPLETION_LOG_Phase4.md](project-docs/TASK_COMPLETION_LOG_Phase4.md)** - Phase 4 completion log
- **[pwa-implementation-guide.md](project-docs/pwa-implementation-guide.md)** - PWA setup guide

## Environment Variables Reference

| Variable               | Type    | Required | Description                                 |
| ---------------------- | ------- | -------- | ------------------------------------------- |
| `DATABASE_URL`         | Private | Yes      | PostgreSQL connection string from Supabase  |
| `SUPABASE_URL`         | Public  | Yes      | Supabase project URL                        |
| `SUPABASE_ANON_KEY`    | Public  | Yes      | Supabase anonymous/public key               |
| `SUPABASE_SERVICE_KEY` | Private | Yes      | Supabase service role key (keep secret!)    |
| `AUTH_SECRET`          | Private | Yes      | JWT signing secret (generate random string) |
| `NUXT_PUBLIC_SITE_URL` | Public  | Yes      | Application URL (localhost or production)   |
| `NUXT_PUBLIC_CURRENCY` | Public  | No       | Currency code (default: SAR)                |

**Note:** Variables prefixed with `NUXT_PUBLIC_` are exposed to the client. All others are server-only.

## Deployment

The application is designed to be deployed on Vercel with Supabase as the database provider.

### Deploying to Vercel

1. **Prepare Repository**

   ```bash
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Select the root directory

3. **Configure Environment Variables**
   - In Vercel project settings, add all required environment variables
   - See [ENVIRONMENT_VARIABLES.md](project-docs/ENVIRONMENT_VARIABLES.md) for complete list
   - Ensure `NUXT_PUBLIC_SITE_URL` is set to your production domain

4. **Deploy**
   - Vercel auto-detects Nuxt configuration
   - Click "Deploy"
   - Monitor deployment logs

5. **Post-Deployment**
   - Run database migrations: `pnpm db:migrate deploy`
   - Seed initial data if needed
   - Test all features on production URL
   - Install PWA on mobile devices for testing

### Continuous Deployment

- **Main branch**: Auto-deploys to production on every push
- **Feature branches**: Auto-creates preview deployments for testing
- **Environment**: Preview deployments use preview environment variables

For detailed deployment instructions, see [DEPLOYMENT.md](project-docs/DEPLOYMENT.md).

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

## License

[Add your license information here]
