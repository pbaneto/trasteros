export const STORAGE_UNIT_SIZES = {
  SMALL: { size: 2, label: '2m²', price: 75 },
  MEDIUM: { size: 3, label: '3m²', price: 100 },
  LARGE: { size: 5, label: '5m²', price: 125 },
  XLARGE: { size: 6, label: '6m²', price: 150 },
} as const;

export const INSURANCE_OPTIONS = [
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

// Helper function to get price by size
export const getPriceBySize = (sizeM2: number): number => {
  const sizeEntry = Object.values(STORAGE_UNIT_SIZES).find(entry => entry.size === sizeM2);
  return sizeEntry?.price || STORAGE_UNIT_SIZES.SMALL.price; // fallback to small if not found
};