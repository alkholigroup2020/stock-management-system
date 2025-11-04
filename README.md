# Food Stock Control System

A multi-location food inventory management system built with **Nuxt 4**. Replaces Excel-based workflows with a modern web application featuring real-time stock tracking, inter-location transfers, weighted average costing (WAC), and coordinated period-end close across multiple sites.

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

## Available Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Type checking
pnpm typecheck

# Build for production
pnpm build

# Preview production build
pnpm preview

# Linting
pnpm lint
```

## Database Setup

**Note:** Database setup will be configured in the next phase (Task 1.2). For now, ensure your environment variables are set correctly.

Once Prisma is configured, you'll use:

```bash
# Push schema changes (development)
pnpm db:push

# Create migrations (production)
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

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

For comprehensive project documentation, see:

- **[CLAUDE.md](CLAUDE.md)** - Development guidelines and best practices
- **[project-docs/PRD.md](project-docs/PRD.md)** - Product requirements
- **[project-docs/System_Design.md](project-docs/System_Design.md)** - System architecture
- **[project-docs/MVP_DEVELOPMENT_TASKS.md](project-docs/MVP_DEVELOPMENT_TASKS.md)** - Development checklist

## Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `DATABASE_URL` | Private | Yes | PostgreSQL connection string from Supabase |
| `SUPABASE_URL` | Public | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Public | Yes | Supabase anonymous/public key |
| `SUPABASE_SERVICE_KEY` | Private | Yes | Supabase service role key (keep secret!) |
| `AUTH_SECRET` | Private | Yes | JWT signing secret (generate random string) |
| `NUXT_PUBLIC_SITE_URL` | Public | Yes | Application URL (localhost or production) |
| `NUXT_PUBLIC_CURRENCY` | Public | No | Currency code (default: SAR) |

**Note:** Variables prefixed with `NUXT_PUBLIC_` are exposed to the client. All others are server-only.

## Deployment

The application is designed to be deployed on Vercel with Supabase as the database provider.

### Deploying to Vercel

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project in Vercel
3. Set all required environment variables in Vercel dashboard
4. Deploy

Vercel will automatically detect the Nuxt configuration and deploy accordingly.

## Support

For issues, questions, or contributions, please refer to the project documentation or contact the development team.

## License

[Add your license information here]
