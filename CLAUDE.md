# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trasteros is a self-storage rental platform built with React/TypeScript, Supabase, and Stripe. Users can browse storage units, make reservations, manage payments, and access units with digital codes via TTLock API integration.

## Development Commands

### Core Commands
- `npm start` - Start development server on http://localhost:3000
- `npm run build` - Build production bundle
- `npm test` - Run tests with Jest and React Testing Library

### Supabase Local Development
- Start Supabase locally: `npx supabase start`
- Apply migrations: `npx supabase migration up`
- Reset database: `npx supabase db reset`
- View dashboard: `npx supabase dashboard`

### Database Management
- Migrations are in `supabase/migrations/`
- Initial schema: `20240101000000_initial_schema.sql`
- Seed data: `supabase/seed.sql`

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── auth/           # Authentication (LoginForm, RegisterForm, etc.)
│   ├── dashboard/      # User dashboard components
│   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   ├── payment/        # Stripe payment processing
│   └── storage/        # Storage unit management
├── contexts/
│   └── AuthContext.tsx # Global auth state management
├── hooks/              # Custom React hooks
├── pages/              # Route-level page components
├── types/              # TypeScript type definitions
└── utils/              # Utility functions and API clients
```

### Key Technologies
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Payments**: Stripe integration with webhooks
- **Forms**: React Hook Form + Zod validation
- **State**: React Context + React Query
- **Access Control**: TTLock API for digital locks

### Database Schema
- `users_profile` - Extended user profiles (linked to auth.users)
- `storage_units` - Available units (2m², 4m², 6m² at €45 one-time)
- `rentals` - User rental records with access codes
- `payments` - Payment transaction history

### Configuration
- TypeScript path aliases: `@/*` maps to `src/*`
- Custom Tailwind theme with primary/secondary color palettes
- Environment variables for Supabase, Stripe, and TTLock APIs

### Integration Points
- **Supabase**: Database, auth, RLS policies in `src/utils/supabase.ts`
- **Stripe**: Payment processing in `src/utils/stripe.ts`
- **TTLock**: Digital lock integration in `src/utils/ttlock.ts`
- **QR Codes**: Generated for unit access using `qrcode` library

### Development Patterns
- Functional components with hooks
- Context API for global state (auth, units, payments)
- React Query for server state management
- Form validation with React Hook Form + Zod
- Row Level Security (RLS) for data access control

### Authentication Flow
1. User registration/login via Supabase Auth
2. Profile creation in `users_profile` table
3. Optional phone verification via SMS
4. JWT-based session management with localStorage persistence

### Payment Processing
1. Unit selection with optional insurance (€20 one-time for €4000 coverage)
2. Stripe payment processing with stored payment methods
3. One-time payment processing
4. Access code generation upon successful payment