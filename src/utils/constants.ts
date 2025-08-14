export const STORAGE_UNIT_SIZES = {
  SMALL: { size: 2, label: '2m²' },
  MEDIUM: { size: 4, label: '4m²' },
  LARGE: { size: 6, label: '6m²' },
} as const;

export const UNIT_PRICE = 45;

export const INSURANCE_OPTIONS = [
  { id: 'none', label: 'Sin seguro', price: 0, coverage: 0 },
  { id: 'basic', label: 'Básico - €2,000', price: 15, coverage: 2000 },
  { id: 'standard', label: 'Estándar - €4,000', price: 20, coverage: 4000 },
  { id: 'premium', label: 'Premium - €8,000', price: 30, coverage: 8000 },
  { id: 'complete', label: 'Completo - €15,000', price: 45, coverage: 15000 },
] as const;

// Legacy constants for compatibility
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
  DASHBOARD: '/dashboard',
  CHECKOUT: '/checkout',
  PROFILE: '/profile',
  RESET_PASSWORD: '/reset-password',
  EMAIL_CONFIRMATION_PENDING: '/email-confirmation-pending',
} as const;