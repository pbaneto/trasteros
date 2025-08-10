import { User, StorageUnit, Rental, Payment } from '../types';

// Database raw types (snake_case)
interface RawUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  phone_verified: boolean;
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
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  payment_date: string;
  payment_method: string;
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
  amount: rawPayment.amount,
  status: rawPayment.status,
  paymentDate: rawPayment.payment_date,
  paymentMethod: rawPayment.payment_method,
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