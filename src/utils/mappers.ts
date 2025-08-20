import { User, StorageUnit, Rental, Payment } from '../types';

// Database raw types (snake_case)
interface RawUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  phone_verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface RawStorageUnit {
  id: string;
  unit_number: string;
  size_m2: number;
  price: number;
  status: 'available' | 'occupied' | 'maintenance';
  location_description: string;
  created_at: string;
}

interface RawRental {
  id: string;
  user_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  price: number;
  insurance_amount: number;
  status: 'active' | 'expired' | 'cancelled';
  stripe_payment_intent_id?: string;
  ttlock_code?: string;
  created_at: string;
  updated_at: string;
  unit?: RawStorageUnit;
}

interface RawPayment {
  id: string;
  rental_id: string;
  stripe_payment_intent_id: string;
  stripe_invoice_id?: string;
  status: 'pending' | 'succeeded' | 'failed';
  payment_date: string;
  payment_method: string;
  payment_type: 'single' | 'subscription';
  subscription_id?: string;
  billing_cycle_start?: string;
  billing_cycle_end?: string;
  is_subscription_active?: boolean;
  next_billing_date?: string;
  // Payment details
  months_paid: number;
  unit_price: number;
  insurance_included: boolean;
  insurance_price: number;
  total_amount: number;
  rental?: {
    id: string;
    unit?: {
      unit_number: string;
      size_m2: number;
    };
  };
}

/**
 * Transform raw user data from database to camelCase format
 */
export const transformUser = (rawUser: RawUser): User => ({
  id: rawUser.id,
  email: rawUser.email,
  firstName: rawUser.first_name,
  lastName: rawUser.last_name,
  phone: rawUser.phone,
  phoneVerified: rawUser.phone_verified,
  active: rawUser.active,
  createdAt: rawUser.created_at,
  updatedAt: rawUser.updated_at,
});

/**
 * Transform raw storage unit data from database to camelCase format
 */
export const transformStorageUnit = (rawUnit: RawStorageUnit): StorageUnit => ({
  id: rawUnit.id,
  unitNumber: rawUnit.unit_number,
  sizeM2: rawUnit.size_m2,
  price: rawUnit.price,
  status: rawUnit.status,
  locationDescription: rawUnit.location_description,
  createdAt: rawUnit.created_at,
});

/**
 * Transform raw rental data from database to camelCase format
 */
export const transformRental = (rawRental: RawRental): Rental => ({
  id: rawRental.id,
  userId: rawRental.user_id,
  unitId: rawRental.unit_id,
  startDate: rawRental.start_date,
  endDate: rawRental.end_date,
  price: rawRental.price,
  insuranceAmount: rawRental.insurance_amount,
  status: rawRental.status,
  stripePaymentIntentId: rawRental.stripe_payment_intent_id,
  ttlockCode: rawRental.ttlock_code,
  createdAt: rawRental.created_at,
  updatedAt: rawRental.updated_at,
  unit: rawRental.unit ? transformStorageUnit(rawRental.unit) : undefined,
});

/**
 * Transform raw payment data from database to camelCase format
 */
export const transformPayment = (rawPayment: RawPayment): Payment => ({
  id: rawPayment.id,
  rentalId: rawPayment.rental_id,
  stripePaymentIntentId: rawPayment.stripe_payment_intent_id,
  stripeInvoiceId: rawPayment.stripe_invoice_id,
  status: rawPayment.status,
  paymentDate: rawPayment.payment_date,
  paymentMethod: rawPayment.payment_method,
  paymentType: rawPayment.payment_type,
  subscriptionId: rawPayment.subscription_id,
  billingCycleStart: rawPayment.billing_cycle_start,
  billingCycleEnd: rawPayment.billing_cycle_end,
  isSubscriptionActive: rawPayment.is_subscription_active,
  nextBillingDate: rawPayment.next_billing_date,
  // Payment details
  monthsPaid: rawPayment.months_paid,
  unitPrice: rawPayment.unit_price,
  insuranceIncluded: rawPayment.insurance_included,
  insurancePrice: rawPayment.insurance_price, 
  totalAmount: rawPayment.total_amount,
  rental: rawPayment.rental ? {
    id: rawPayment.rental.id,
    unit: rawPayment.rental.unit ? {
      unitNumber: rawPayment.rental.unit.unit_number,
      sizeM2: rawPayment.rental.unit.size_m2,
    } : undefined,
  } : undefined,
});

/**
 * Transform arrays of raw data
 */
export const transformUsers = (rawUsers: RawUser[]): User[] =>
  rawUsers.map(transformUser);

export const transformStorageUnits = (rawUnits: RawStorageUnit[]): StorageUnit[] =>
  rawUnits.map(transformStorageUnit);

export const transformRentals = (rawRentals: RawRental[]): Rental[] =>
  rawRentals.map(transformRental);

export const transformPayments = (rawPayments: RawPayment[]): Payment[] =>
  rawPayments.map(transformPayment);