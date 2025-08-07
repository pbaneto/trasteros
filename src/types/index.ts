export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageUnit {
  id: string;
  unitNumber: string;
  sizeM2: number;
  monthlyPrice: number;
  status: 'available' | 'occupied' | 'maintenance';
  locationDescription: string;
  createdAt: string;
}

export interface Rental {
  id: string;
  userId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  monthlyPrice: number;
  insuranceAmount: number;
  status: 'active' | 'expired' | 'cancelled';
  stripeSubscriptionId?: string;
  ttlockCode?: string;
  qrCodeData?: string;
  createdAt: string;
  unit?: StorageUnit;
}

export interface Payment {
  id: string;
  rentalId: string;
  stripePaymentIntentId: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  paymentDate: string;
  paymentMethod: string;
  rental?: {
    id: string;
    unit?: {
      unit_number: string;
      size_m2: number;
    };
  };
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  verifyOTP: (email: string, token: string) => Promise<void>;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'google_pay' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface CheckoutData {
  unitId: string;
  paymentMethodId: string;
  includeInsurance: boolean;
}

export interface QRCodeData {
  rentalId: string;
  unitNumber: string;
  accessCode: string;
  expiresAt: string;
}