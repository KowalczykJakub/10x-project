# Deployment Guide

## Prerequisites

1. Supabase account and project created at https://app.supabase.com
2. Supabase CLI installed: `npm install -g supabase`
3. GitHub repository with Actions enabled

## Setting Up Production Database

### 1. Link Your Local Project to Supabase

First, log in to Supabase CLI:

```bash
npx supabase login
```

Link your local project to your Supabase project:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
```

To find your `PROJECT_REF`:
- Go to your Supabase dashboard
- Settings → General
- The "Reference ID" is your project ref (e.g., `abcdefghijklm`)

### 2. Push Migrations to Production

Run migrations on your production database:

```bash
npx supabase db push
```

This will apply all migrations from `supabase/migrations/` to your production database.

### 3. Verify Migrations

Check if migrations were successful:

```bash
npx supabase db remote status
```

### 4. Generate TypeScript Types (Optional)

Update database types based on production schema:

```bash
npx supabase gen types typescript --linked > src/db/database.types.ts
```

## Environment Variables

### Local Development

Create a `.env` file (gitignored) with your development values:

```bash
cp .env.example .env
# Edit .env with your actual values
```

### Production/CI (GitHub Secrets)

Add these secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

Required secrets:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for admin operations)
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_ACCESS_TOKEN` - For Supabase CLI in CI (get from: https://app.supabase.com/account/tokens)
- `SUPABASE_PROJECT_ID` - Your project reference ID
- `OPENROUTER_API_KEY` - OpenRouter API key

## Deploying Application

### Manual Deployment

1. Build the application:
   ```bash
   npm ci
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting provider (Vercel, Netlify, Cloudflare Pages, etc.)

### Automated Deployment (GitHub Actions)

The workflow in `.github/workflows/ci.yml` will automatically:
1. Run tests
2. Run database migrations
3. Build the application
4. Deploy to your hosting provider

## Troubleshooting

### Migration Errors

If you get migration errors:

1. Check your database connection:
   ```bash
   npx supabase db remote status
   ```

2. Reset remote database (⚠️ WARNING: This deletes all data):
   ```bash
   npx supabase db remote reset
   ```

3. View migration history:
   ```bash
   npx supabase db remote status --linked
   ```

### Connection Issues

- Verify your DATABASE_URL is correct
- Check if your IP is whitelisted in Supabase dashboard (Settings → Database → Network Restrictions)
- Ensure you're using the correct password

## Database Management

### Create New Migration

```bash
npx supabase migration new migration_name
```

### View Remote Database

```bash
npx supabase db remote status
```

### Pull Remote Schema Changes

```bash
npx supabase db pull
```
