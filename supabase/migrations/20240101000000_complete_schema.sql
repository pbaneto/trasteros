-- Complete Trasteros storage rental app schema
-- Includes subscription support, rental metadata, and pending status
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users_profile table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users_profile (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    phone_verified BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6),
    verification_code_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create storage_units table
CREATE TABLE IF NOT EXISTS storage_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_number VARCHAR(10) UNIQUE NOT NULL,
    size_m2 INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create rentals table with payment type support and pending status
CREATE TABLE IF NOT EXISTS rentals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES storage_units(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    insurance_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    stripe_payment_intent_id VARCHAR(255),
    ttlock_code VARCHAR(20),
    -- Payment type support columns
    months_paid INTEGER DEFAULT 1 CHECK (months_paid >= 0),
    payment_type VARCHAR(20) DEFAULT 'single' CHECK (payment_type IN ('single', 'subscription')),
    subscription_status VARCHAR(20) DEFAULT NULL CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'unpaid', 'pending')),
    next_payment_date DATE,
    -- Subscription metadata (replaces rental_metadata table)
    stripe_subscription_id VARCHAR(255),
    checkout_session_id VARCHAR(255),
    subscription_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create payments table with subscription support
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    payment_method VARCHAR(50) NOT NULL,
    -- Payment type support columns
    payment_type VARCHAR(20) DEFAULT 'single' CHECK (payment_type IN ('single', 'subscription')),
    subscription_id VARCHAR(255),
    billing_cycle_start DATE,
    billing_cycle_end DATE,
    is_subscription_active BOOLEAN DEFAULT FALSE,
    next_billing_date DATE
);


-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON users_profile(email);
CREATE INDEX IF NOT EXISTS idx_storage_units_status ON storage_units(status);
CREATE INDEX IF NOT EXISTS idx_storage_units_size ON storage_units(size_m2);
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_unit_id ON rentals(unit_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_rentals_payment_type ON rentals(payment_type);
CREATE INDEX IF NOT EXISTS idx_rentals_subscription_status ON rentals(subscription_status);
CREATE INDEX IF NOT EXISTS idx_rentals_next_payment_date ON rentals(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_rentals_stripe_subscription_id ON rentals(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_rentals_checkout_session_id ON rentals(checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_rental_id ON payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_next_billing_date ON payments(next_billing_date);

-- Set up Row Level Security (RLS)
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON users_profile
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users_profile
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users_profile
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Storage units are publicly readable but only admin writable
CREATE POLICY "Anyone can view storage units" ON storage_units
    FOR SELECT TO PUBLIC USING (true);

-- Admin only policies for storage units
CREATE POLICY "Only admins can modify storage units" ON storage_units
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE id = auth.uid() 
            AND email IN ('admin@trasteros.com')
        )
    );

-- Rentals are only accessible to the rental owner
CREATE POLICY "Users and service role can view rentals" ON rentals
    FOR SELECT USING (
        current_setting('role') = 'service_role'
        OR auth.uid() = user_id
    );

CREATE POLICY "Users and service role can insert rentals" ON rentals
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' 
        OR auth.uid() = user_id
    );

CREATE POLICY "Users can update own rentals" ON rentals
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments are only accessible to the rental owner
CREATE POLICY "Users and service role can view payments" ON payments
    FOR SELECT USING (
        current_setting('role') = 'service_role'
        OR EXISTS (
            SELECT 1 FROM rentals 
            WHERE rentals.id = payments.rental_id 
            AND rentals.user_id = auth.uid()
        )
    );

CREATE POLICY "System and service role can insert payments" ON payments
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role'
        OR EXISTS (
            SELECT 1 FROM rentals 
            WHERE rentals.id = payments.rental_id 
            AND rentals.user_id = auth.uid()
        )
    );


-- Create a comprehensive function to handle user profile creation with OAuth support
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    first_name_value TEXT;
    last_name_value TEXT;
    full_name TEXT;
    name_parts TEXT[];
BEGIN
    -- Log the trigger execution
    RAISE LOG 'Creating profile for user: %', NEW.id;
    
    -- Extract first name with multiple fallbacks
    first_name_value := COALESCE(
        NEW.raw_user_meta_data->>'first_name',     -- Regular signup
        NEW.raw_user_meta_data->>'given_name',     -- Google OAuth
        ''
    );
    
    -- Extract last name with multiple fallbacks
    last_name_value := COALESCE(
        NEW.raw_user_meta_data->>'last_name',      -- Regular signup
        NEW.raw_user_meta_data->>'family_name',    -- Google OAuth
        ''
    );
    
    -- If both names are empty, try to parse from full_name or name
    IF first_name_value = '' AND last_name_value = '' THEN
        full_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            ''
        );
        
        -- Split full name into parts if available
        IF full_name != '' THEN
            name_parts := string_to_array(trim(full_name), ' ');
            
            -- Extract first name (first part)
            IF array_length(name_parts, 1) >= 1 THEN
                first_name_value := name_parts[1];
            END IF;
            
            -- Extract last name (remaining parts joined)
            IF array_length(name_parts, 1) >= 2 THEN
                last_name_value := array_to_string(name_parts[2:], ' ');
            END IF;
        END IF;
    END IF;
    
    -- Trim whitespace and ensure non-null values
    first_name_value := COALESCE(trim(first_name_value), '');
    last_name_value := COALESCE(trim(last_name_value), '');
    
    -- Insert the user profile, ignore if it already exists
    INSERT INTO public.users_profile (
        id, 
        email, 
        first_name, 
        last_name, 
        phone, 
        phone_verified
    ) VALUES (
        NEW.id, 
        NEW.email,
        first_name_value,
        last_name_value,
        NEW.raw_user_meta_data->>'phone',
        false
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'Profile created for user % with names: "%" "%"', NEW.id, first_name_value, last_name_value;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment explaining the trigger
COMMENT ON FUNCTION public.handle_new_user() IS 'Enhanced user profile creation trigger supporting OAuth providers (Google, etc.) with comprehensive name field mapping';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_users_profile_updated_at
    BEFORE UPDATE ON users_profile
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at
    BEFORE UPDATE ON rentals
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- Create a function to calculate rental end date based on payment type and months paid
CREATE OR REPLACE FUNCTION calculate_rental_end_date(
    start_date DATE,
    months_paid INTEGER,
    payment_type VARCHAR(20)
) RETURNS DATE AS $$
BEGIN
    -- For single payments, add the number of months paid
    IF payment_type = 'single' THEN
        RETURN start_date + INTERVAL '1 month' * months_paid;
    -- For subscriptions, initially set to one month (will be extended with each payment)
    ELSE
        RETURN start_date + INTERVAL '1 month';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to automatically set end_date when rental is created/updated
CREATE OR REPLACE FUNCTION update_rental_end_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update end_date if start_date, months_paid, or payment_type changed
    IF TG_OP = 'INSERT' OR 
       OLD.start_date != NEW.start_date OR 
       OLD.months_paid != NEW.months_paid OR 
       OLD.payment_type != NEW.payment_type THEN
        
        NEW.end_date := calculate_rental_end_date(
            NEW.start_date, 
            NEW.months_paid, 
            NEW.payment_type
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update end_date
DROP TRIGGER IF EXISTS trigger_update_rental_end_date ON rentals;
CREATE TRIGGER trigger_update_rental_end_date
    BEFORE INSERT OR UPDATE ON rentals
    FOR EACH ROW EXECUTE FUNCTION update_rental_end_date();

-- Add comments to clarify the schema
COMMENT ON COLUMN storage_units.price IS 'Monthly rental price in euros';
COMMENT ON COLUMN rentals.price IS 'Monthly rental price for this rental in euros';
COMMENT ON COLUMN rentals.status IS 'Current status of the rental: active, expired, cancelled, or pending';
COMMENT ON COLUMN rentals.months_paid IS 'Number of months paid upfront for single payments';
COMMENT ON COLUMN rentals.payment_type IS 'Payment model used for this rental';
COMMENT ON COLUMN rentals.subscription_status IS 'Current status of subscription (only for subscription rentals)';
COMMENT ON COLUMN rentals.next_payment_date IS 'Next expected payment date for subscription rentals';
COMMENT ON COLUMN payments.payment_type IS 'Type of payment: single (one-time for multiple months) or subscription (recurring monthly)';
COMMENT ON COLUMN payments.subscription_id IS 'Stripe subscription ID for subscription payments';
COMMENT ON COLUMN payments.billing_cycle_start IS 'Start date of current billing cycle for subscriptions';
COMMENT ON COLUMN payments.billing_cycle_end IS 'End date of current billing cycle for subscriptions';
COMMENT ON COLUMN payments.is_subscription_active IS 'Whether the subscription is currently active';
COMMENT ON COLUMN payments.next_billing_date IS 'Next scheduled billing date for subscriptions';
COMMENT ON COLUMN rentals.stripe_subscription_id IS 'Stripe subscription ID for subscription-based rentals';
COMMENT ON COLUMN rentals.checkout_session_id IS 'Stripe checkout session ID for this rental';
COMMENT ON COLUMN rentals.subscription_metadata IS 'Additional subscription metadata from Stripe checkout session';