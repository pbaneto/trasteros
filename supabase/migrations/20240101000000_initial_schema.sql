-- Initial schema for Trasteros storage rental app
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create storage_units table
CREATE TABLE IF NOT EXISTS storage_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_number VARCHAR(10) UNIQUE NOT NULL,
    size_m2 INTEGER NOT NULL CHECK (size_m2 IN (2, 4, 6)),
    monthly_price DECIMAL(10,2) NOT NULL DEFAULT 45.00,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create rentals table
CREATE TABLE IF NOT EXISTS rentals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    unit_id UUID REFERENCES storage_units(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    insurance_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
    stripe_subscription_id VARCHAR(255),
    ttlock_code VARCHAR(20),
    qr_code_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    payment_method VARCHAR(50) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_email ON users_profile(email);
CREATE INDEX IF NOT EXISTS idx_storage_units_status ON storage_units(status);
CREATE INDEX IF NOT EXISTS idx_storage_units_size ON storage_units(size_m2);
CREATE INDEX IF NOT EXISTS idx_rentals_user_id ON rentals(user_id);
CREATE INDEX IF NOT EXISTS idx_rentals_unit_id ON rentals(unit_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_payments_rental_id ON payments(rental_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

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
CREATE POLICY "Users can view own rentals" ON rentals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rentals" ON rentals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rentals" ON rentals
    FOR UPDATE USING (auth.uid() = user_id);

-- Payments are only accessible to the rental owner
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rentals 
            WHERE rentals.id = payments.rental_id 
            AND rentals.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert payments" ON payments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM rentals 
            WHERE rentals.id = payments.rental_id 
            AND rentals.user_id = auth.uid()
        )
    );

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users_profile (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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