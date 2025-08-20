# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trasteros is a React TypeScript web application for storage unit rentals with integrated payment processing, smart lock management, and WhatsApp notifications. The architecture combines:

- **Frontend**: React 18 + TypeScript + Tailwind CSS + React Router + React Query
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + Storage)
- **Payment**: Stripe integration with subscriptions support
- **Smart Locks**: TTLock API integration
- **Notifications**: Twilio WhatsApp messaging

## Development Commands

```bash
# Start development server
npm start

# Build production bundle
npm run build

# Run tests
npm test

# Start Supabase local development
npx supabase start

# Stop Supabase local development
npx supabase stop

# Reset Supabase database with migrations
npx supabase db reset

# Generate TypeScript types from Supabase schema
npx supabase gen types typescript --local > src/types/supabase.ts

# Deploy Supabase edge functions
npx supabase functions deploy [function-name]

# View Supabase logs
npx supabase functions logs [function-name]
```

## Architecture

### Core Structure
- `src/contexts/AuthContext.tsx` - Central authentication state management using Supabase Auth
- `src/utils/supabase.ts` - Supabase client configuration with PKCE flow
- `src/utils/stripe.ts` - Stripe client and payment utilities
- `src/types/index.ts` - Core TypeScript interfaces for User, StorageUnit, Rental, Payment

### Component Organization
- `src/components/auth/` - Authentication forms and modals
- `src/components/dashboard/` - User dashboard components
- `src/components/storage/` - Storage unit reservation and management
- `src/components/payment/` - Stripe payment integration components
- `src/pages/` - Route-level page components

### Supabase Integration
- Database: PostgreSQL with RLS policies for security
- Edge Functions: `/supabase/functions/` contains Deno functions for:
  - `create-checkout-session` - Stripe payment intent creation
  - `stripe-webhook` - Payment processing webhooks  
  - `send-whatsapp-verification` - Twilio WhatsApp notifications
  - `verify-phone-code` - Phone number verification
- Migrations: Complete schema in `/supabase/migrations/`
- Local development uses ports: 54321 (API), 54322 (DB), 54323 (Studio)

### Key Features
- **Authentication**: Email/password and Google OAuth via Supabase Auth
- **Payment Processing**: Single payments and subscriptions via Stripe
- **Smart Lock Integration**: TTLock API for access code generation
- **Phone Verification**: WhatsApp-based phone verification via Twilio
- **Responsive UI**: Tailwind CSS with custom primary/secondary color scheme

### Environment Variables Required
```
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

### Database Schema Overview
- `users_profile` - Extended user information with phone verification
- `storage_units` - Available storage units with pricing
- `rentals` - User rentals with subscription support and TTLock codes
- `payments` - Payment records with Stripe integration and detailed billing info

The application uses React Query for server state management and implements protected routes with automatic redirects based on authentication status.