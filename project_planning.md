# Self-Storage Rental Website Project Plan

## 1. Requirements Analysis

### Main Functionalities Identified from PDF:
- **User Authentication System**
  - Email/password registration and login
  - Google OAuth integration
  - Mobile phone verification via SMS
  - Password reset functionality

- **Storage Unit Management**
  - Display available storage units (2m², 4m², 6m²) at 45€/month
  - Unit reservation system
  - Real-time availability tracking

- **User Dashboard ("Mis Trasteros")**
  - View active and inactive storage units
  - Storage unit details with expiration dates
  - QR code generation for unit access
  - Payment history and status tracking
  - Contract renewal functionality

- **Payment Processing**
  - Multiple payment options (Credit Card, Google Pay, PayPal)
  - Insurance options (up to 4000€ coverage for 20€)
  - Recurring payment management
  - Payment confirmation via SMS

- **User Profile Management**
  - Personal data management
  - Password change functionality
  - Account deletion (only when no active units)

### Additional Requirements:
- Terms and conditions page
- FAQ section
- Responsive design for mobile/tablet/desktop
- Multi-language support (Spanish primary)
- Admin panel for unit management
- Notification system (email/SMS)

**Estimated Timeline: 1 week**

## 2. Technology Stack Overview

- **React**: Frontend framework for building interactive UI components and managing application state
- **Tailwind CSS**: Utility-first CSS framework for rapid, responsive design implementation
- **Supabase**: Backend-as-a-service providing PostgreSQL database, authentication, real-time subscriptions, and API
- **Stripe**: Payment processing for subscriptions, one-time payments, and payment method management
- **TTLock API**: Integration for generating and managing digital lock codes for storage units
- **Deployment**: Vercel/Netlify for frontend, Supabase for backend infrastructure

**Estimated Timeline: 2 days (setup and configuration)**

## 3. Frontend Development

### UI Components Structure:
- **Authentication Components**
  - LoginForm
  - RegisterForm
  - PhoneVerification
  - PasswordReset

- **Layout Components**
  - Header with navigation and user menu
  - Footer
  - Sidebar for user dashboard
  - ResponsiveLayout wrapper

- **Storage Unit Components**
  - UnitCard (display unit info and pricing)
  - UnitGrid (available units display)
  - ReservationModal
  - UnitDetailsPanel

- **Dashboard Components**
  - ActiveUnitsTable
  - PaymentHistory
  - QRCodeGenerator
  - ContractRenewal
  - UserProfile

- **Payment Components**
  - CheckoutForm
  - PaymentMethodSelector
  - PaymentConfirmation
  - PricingSummary

### React Implementation Strategy:
- Use functional components with React Hooks
- Implement Context API for global state management (user, units, payments)
- React Router for navigation
- React Query for server state management and caching
- Form validation using React Hook Form
- Toast notifications for user feedback

### Tailwind CSS Implementation:
- Mobile-first responsive design approach
- Custom color scheme matching brand requirements
- Reusable component classes
- Dark mode support preparation
- Accessible design patterns

**Estimated Timeline: 4 weeks**

## 4. Backend Development

### Supabase Database Schema:

```sql
-- Users table (extends Supabase auth.users)
users_profile (
  id (UUID, FK to auth.users),
  first_name VARCHAR,
  last_name VARCHAR,
  phone VARCHAR,
  phone_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Storage units
storage_units (
  id UUID PRIMARY KEY,
  unit_number VARCHAR UNIQUE,
  size_m2 INTEGER,
  monthly_price DECIMAL,
  status VARCHAR, -- available, occupied, maintenance
  location_description TEXT,
  created_at TIMESTAMP
)

-- Reservations/Rentals
rentals (
  id UUID PRIMARY KEY,
  user_id UUID FK,
  unit_id UUID FK,
  start_date DATE,
  end_date DATE,
  monthly_price DECIMAL,
  insurance_amount DECIMAL,
  status VARCHAR, -- active, expired, cancelled
  stripe_subscription_id VARCHAR,
  ttlock_code VARCHAR,
  qr_code_data TEXT,
  created_at TIMESTAMP
)

-- Payments
payments (
  id UUID PRIMARY KEY,
  rental_id UUID FK,
  stripe_payment_intent_id VARCHAR,
  amount DECIMAL,
  status VARCHAR,
  payment_date TIMESTAMP,
  payment_method VARCHAR
)
```

### API Endpoints (Supabase Functions):
- Authentication endpoints (handled by Supabase Auth)
- GET/POST `/api/units` - Unit availability and reservation
- GET/POST/PUT `/api/rentals` - Rental management
- POST `/api/payments/create-intent` - Stripe payment processing
- POST `/api/generate-access-code` - TTLock integration
- GET/PUT `/api/user/profile` - User profile management

### Row Level Security (RLS) Policies:
- Users can only access their own profile and rental data
- Storage units are publicly readable but only admin writable
- Payments are only accessible to the rental owner

**Estimated Timeline: 3 weeks**

## 5. Integration of External Services

### Stripe Integration:
- **Setup Phase**:
  - Configure Stripe webhook endpoints
  - Set up subscription products for different unit sizes
  - Implement payment intent creation
  - Configure insurance as add-on product

- **Implementation**:
  - Payment form with Stripe Elements
  - Subscription management for recurring payments
  - Webhook handling for payment status updates
  - Payment method storage for future use

### TTLock API Integration:
- **Setup Phase**:
  - Obtain TTLock API credentials
  - Study API documentation for code generation
  - Set up secure credential storage in Supabase

- **Implementation**:
  - Function to generate unique access codes
  - Code expiration management
  - Integration with QR code generation
  - Fallback mechanisms for API failures

### SMS Integration (for verification):
- Implement Twilio or similar service for SMS verification
- Phone number validation and verification flow
- SMS notifications for payments and access codes

**Estimated Timeline: 2 weeks**

## 6. Testing and Quality Assurance

### Testing Strategy:
- **Unit Tests** (Jest + React Testing Library):
  - Component rendering tests
  - User interaction tests
  - Utility function tests
  - API integration tests

- **Integration Tests**:
  - Authentication flow testing
  - Payment processing end-to-end
  - Database operations testing
  - External API integration tests

- **User Acceptance Testing**:
  - Complete user journey testing
  - Cross-browser compatibility
  - Mobile responsiveness testing
  - Accessibility compliance (WCAG 2.1)

### Quality Assurance:
- ESLint and Prettier for code consistency
- TypeScript for type safety
- Code review process using pull requests
- Performance monitoring and optimization
- Security audit of authentication and payment flows

**Estimated Timeline: 2 weeks**

## 7. Deployment and Maintenance

### Deployment Process:
- **Frontend**: Deploy React app to Vercel with automatic deployments from main branch
- **Backend**: Supabase handles backend infrastructure
- **Environment Management**: Separate development, staging, and production environments
- **Domain Configuration**: Custom domain setup with SSL certificates
- **CI/CD Pipeline**: Automated testing and deployment on code commits

### Maintenance and Updates:
- **Monitoring**:
  - Application performance monitoring
  - Error tracking with Sentry
  - Database performance monitoring via Supabase dashboard
  - Payment processing monitoring

- **Regular Maintenance**:
  - Weekly dependency updates
  - Monthly security audits
  - Quarterly performance reviews
  - User feedback implementation

- **Backup Strategy**:
  - Daily database backups via Supabase
  - Code repository backup on GitHub
  - Documentation and configuration backup

**Estimated Timeline: 1 week deployment + ongoing maintenance**

## Project Timeline Summary

| Phase | Duration | Key Milestones |
|-------|----------|----------------|
| Requirements & Setup | 1.5 weeks | Requirements finalized, tech stack configured |
| Frontend Development | 4 weeks | All UI components completed, responsive design implemented |
| Backend Development | 3 weeks | Database schema, API endpoints, authentication complete |
| External Integrations | 2 weeks | Stripe and TTLock integrations functional |
| Testing & QA | 2 weeks | All tests passing, security audit complete |
| Deployment | 1 week | Production deployment successful |
| **Total Project Duration** | **13.5 weeks** | **Fully functional website live** |

## Risk Mitigation:
- TTLock API dependency - Have manual code generation fallback
- Payment processing issues - Implement comprehensive error handling
- Mobile verification costs - Set up usage monitoring and limits
- Scalability concerns - Design with horizontal scaling in mind