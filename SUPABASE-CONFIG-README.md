# Supabase Configuration Guide

This guide explains how to set up and configure Supabase for the LearnFinity application, particularly for database seeding and other back-end operations.

## Configuration Files

The application uses the following files for Supabase configuration:

1. `.env` - Main environment configuration file (for Node.js scripts)
2. `.env.local` - Local environment configuration (for development with Vite)
3. `.env.example` - Example configuration showing required variables

## Required Environment Variables

### For Browser/Vite Usage

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### For Node.js Scripts (including seeding scripts)

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

### For Admin Operations (optional)

```
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

## Setting Up Your Environment

1. Copy the `.env.example` file to create `.env` and `.env.local` files
2. Fill in your Supabase credentials for both browser and Node.js environments
3. For admin operations that require higher privileges, add your Supabase service role key

## How Environment Variables Are Loaded

- **Browser**: Environment variables prefixed with `VITE_` are loaded by Vite during the build process
- **Node.js**: Environment variables are loaded using `dotenv` package in Node.js scripts
- **Database Seeding**: The `seedDatabase.ts` script loads environment variables using `dotenv/config`

## Troubleshooting

If you encounter Supabase connection issues:

1. Verify that your `.env` file contains both VITE_ and non-VITE_ versions of the Supabase URL and key
2. Check that your Supabase project is active and accessible
3. Ensure you're using the correct project URL and API keys
4. For seeding operations that require admin privileges, make sure you've added the service role key

## Security Notes

- **Never commit your actual Supabase keys to version control**
- The `.env` and `.env.local` files should be in your `.gitignore`
- Only `.env.example` should be committed, with placeholder values
- Service role keys have admin privileges and should be protected carefully 