export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  phoneVerified: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StorageUnit {
  id: string;
  unitNumber: string;
  sizeM2: number;
  price: number;
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
  price: number;
  insuranceAmount: number;
  status: 'active' | 'expired' | 'cancelled';
  stripePaymentIntentId?: string;
  ttlockCode?: string;
  createdAt: string;
  updatedAt: string;
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
  paymentType: 'single' | 'subscription';
  subscriptionId?: string;
  billingCycleStart?: string;
  billingCycleEnd?: string;
  isSubscriptionActive?: boolean;
  nextBillingDate?: string;
  rental?: {
    id: string;
    unit?: {
      unitNumber: string;
      sizeM2: number;
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

