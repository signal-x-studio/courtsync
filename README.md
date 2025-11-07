# CourtSync

Volleyball tournament scheduling and live scoring app built with SvelteKit 5.

## Tech Stack

- **SvelteKit 2.0** + **Svelte 5** (Runes)
- **Supabase** (real-time database)
- **Tailwind CSS v4**
- **TypeScript** (strict mode)
- **Vercel** (deployment)

## Features

- 📋 Event and club-based match filtering
- ⭐ Favorite teams tracking
- 📷 Media coverage planning
- 🔴 Real-time live scoring
- 🔒 Match locking prevents concurrent scoring
- 📱 Mobile-first responsive design
- 🌙 Dark mode by default

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment variables
```bash
cp .env.example .env
# Fill in Supabase credentials
```

### 3. Setup Supabase
See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions:
- Create project at supabase.com
- Run `supabase/schema.sql` in SQL editor
- Enable Realtime for tables
- Add credentials to `.env`

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Development

```bash
# Type checking
npm run check

# Linting
npm run lint

# Testing
npm run test

# E2E tests
npm run test:e2e

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Or use Vercel CLI:
```bash
vercel --prod
```

## Project Structure

```
src/
├── routes/           # SvelteKit routes (pages)
├── lib/
│   ├── components/   # Svelte components
│   ├── stores/       # Svelte stores (state)
│   ├── api/          # API clients
│   ├── supabase/     # Supabase integration
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
└── app.css          # Global styles
```

## Architecture

See [docs/sveltekit-architecture.md](./docs/sveltekit-architecture.md) for detailed architecture documentation.

## License

MIT
