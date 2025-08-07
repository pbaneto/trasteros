export const STORAGE_UNIT_SIZES = {
  SMALL: { size: 2, label: '2m²' },
  MEDIUM: { size: 4, label: '4m²' },
  LARGE: { size: 6, label: '6m²' },
} as const;

export const MONTHLY_PRICE = 45;
export const INSURANCE_PRICE = 20;
export const INSURANCE_COVERAGE = 4000;

export const PAYMENT_METHODS = {
  CARD: 'card',
  GOOGLE_PAY: 'google_pay',
  PAYPAL: 'paypal',
} as const;

export const RENTAL_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
} as const;

export const UNIT_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  MAINTENANCE: 'maintenance',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  CHECKOUT: '/checkout',
  PROFILE: '/profile',
  RESET_PASSWORD: '/reset-password',
  EMAIL_CONFIRMATION_PENDING: '/email-confirmation-pending',
} as const;