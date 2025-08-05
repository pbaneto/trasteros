# Trasteros - Self-Storage Rental Platform

A complete self-storage rental website built with React, TypeScript, Supabase, and Stripe. Users can browse available storage units, make reservations, manage payments, and access their units with digital codes.

## Features

### 🔐 Authentication System
- Email/password registration and login
- Google OAuth integration (configured but not implemented)
- Mobile phone verification via SMS
- Password reset functionality

### 🏠 Storage Unit Management
- Browse available storage units (2m², 4m², 6m²)
- Real-time availability tracking
- Unit reservation system
- Interactive unit grid with filtering

### 📊 User Dashboard
- View active and inactive storage units
- Storage unit details with expiration dates
- QR code generation for unit access
- Payment history and status tracking
- Contract renewal functionality

### 💳 Payment Processing
- Stripe integration for secure payments
- Multiple payment options (Credit Card, Google Pay, PayPal)
- Insurance options (up to €4000 coverage for €20/month)
- Recurring payment management
- Payment confirmation via SMS

### 👤 User Profile Management
- Personal data management
- Password change functionality
- Phone verification
- Account deletion (only when no active units)

### 🔑 Access Control
- TTLock API integration for digital access codes
- QR code generation for mobile access
- 24/7 access to storage units

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Backend**: Supabase (PostgreSQL, Authentication, API)
- **Payments**: Stripe
- **Routing**: React Router v6
- **State Management**: React Context API + React Query
- **Forms**: React Hook Form with Zod validation
- **Smart Locks**: TTLock API integration
- **QR Codes**: qrcode library
- **Notifications**: React Toastify
- **Date Handling**: date-fns

## Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── PasswordReset.tsx
│   │   └── PhoneVerification.tsx
│   ├── dashboard/            # Dashboard components
│   │   ├── ActiveUnitsTable.tsx
│   │   ├── PaymentHistory.tsx
│   │   ├── QRCodeGenerator.tsx
│   │   ├── ContractRenewal.tsx
│   │   └── UserProfile.tsx
│   ├── layout/               # Layout components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── ResponsiveLayout.tsx
│   ├── payment/              # Payment components
│   │   ├── CheckoutForm.tsx
│   │   ├── PaymentMethodSelector.tsx
│   │   ├── PaymentConfirmation.tsx
│   │   └── PricingSummary.tsx
│   └── storage/              # Storage unit components
│       ├── UnitCard.tsx
│       ├── UnitGrid.tsx
│       ├── ReservationModal.tsx
│       └── UnitDetailsPanel.tsx
├── contexts/
│   └── AuthContext.tsx      # Authentication context
├── hooks/                   # Custom React hooks
├── pages/                   # Page components
│   ├── HomePage.tsx
│   ├── UnitsPage.tsx
│   ├── DashboardPage.tsx
│   ├── CheckoutPage.tsx
│   └── ProfilePage.tsx
├── types/
│   └── index.ts             # TypeScript type definitions
├── utils/                   # Utility functions
│   ├── supabase.ts          # Supabase client configuration
│   ├── stripe.ts            # Stripe utilities
│   ├── constants.ts         # App constants
│   └── ttlock.ts            # TTLock API integration
└── App.tsx                  # Main application component
```

## Setup Instructions

### 1. Prerequisites
- Node.js 16+ 
- npm or yarn
- Supabase account
- Stripe account
- TTLock developer account (optional)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd trasteros

# Install dependencies
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# TTLock API Configuration (optional)
REACT_APP_TTLOCK_CLIENT_ID=your_ttlock_client_id
REACT_APP_TTLOCK_CLIENT_SECRET=your_ttlock_client_secret
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the SQL commands from `supabase-setup.sql` in your Supabase SQL editor
3. This will create all necessary tables, indexes, RLS policies, and sample data

### 5. Stripe Configuration

1. Create a Stripe account and get your publishable key
2. Set up webhook endpoints for payment processing
3. Configure payment products for storage unit subscriptions
4. Add your webhook endpoint URL to your backend (not included in this frontend-only setup)

### 6. Start Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`

## Database Schema

### Tables

- **users_profile**: Extended user profiles (linked to Supabase auth.users)
- **storage_units**: Available storage units with pricing and status
- **rentals**: User rental records with access codes and subscription info
- **payments**: Payment transaction history

### Key Features

- Row Level Security (RLS) for data protection
- Automatic user profile creation on signup
- Timestamp triggers for audit trails
- Indexes for optimal query performance

## Features in Detail

### Authentication Flow
1. User registers with email/password
2. Email verification (handled by Supabase)
3. Optional phone verification via SMS
4. Profile completion

### Rental Process
1. Browse available storage units
2. Select unit size and add insurance (optional)
3. Secure checkout with Stripe
4. Immediate access code generation
5. QR code for mobile access

### Dashboard Features
- Active rentals overview
- Payment history with detailed transaction info
- QR code generation and printing
- Contract renewal with discount options
- Profile management with phone verification

## Customization

### Styling
- Tailwind CSS with custom color scheme
- Responsive design for mobile, tablet, and desktop
- Custom component classes in `src/index.css`

### Configuration
- All constants in `src/utils/constants.ts`
- Pricing, unit sizes, and other settings easily configurable

## Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `build` folder to your hosting platform
3. Set environment variables in your hosting platform

### Backend Requirements
- Supabase handles most backend functionality
- You'll need to implement Stripe webhook handlers for production
- SMS service integration for phone verification
- TTLock API integration for actual smart lock control

## Security Features

- Row Level Security (RLS) in Supabase
- Secure payment processing with Stripe
- JWT-based authentication
- Input validation with Zod schemas
- XSS protection through React's built-in sanitization

## Browser Support

- Modern browsers with ES6+ support
- Mobile-responsive design
- Progressive Web App ready (with additional configuration)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests (when implementing)
5. Submit a pull request


Built with ❤️ using React, TypeScript, Supabase, and Stripe.