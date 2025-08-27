-- Fix Supabase Performance and Security Lints
-- This migration addresses auth.uid() performance issues and consolidates multiple permissive policies

-- Drop existing policies that have performance issues
DROP POLICY IF EXISTS "Users can view own profile" ON users_profile;
DROP POLICY IF EXISTS "Users can update profile" ON users_profile;
DROP POLICY IF EXISTS "Users can insert own profile" ON users_profile;
DROP POLICY IF EXISTS "Anyone can view storage units" ON storage_units;
DROP POLICY IF EXISTS "Only admins can modify storage units" ON storage_units;
DROP POLICY IF EXISTS "Users and service role can view rentals" ON rentals;
DROP POLICY IF EXISTS "Users and service role can insert rentals" ON rentals;
DROP POLICY IF EXISTS "Users can update own rentals" ON rentals;
DROP POLICY IF EXISTS "Users and service role can view payments" ON payments;
DROP POLICY IF EXISTS "System and service role can insert payments" ON payments;

-- FIXED: Users profile policies with optimized auth.uid() calls
-- Users can view their own profile only if active
CREATE POLICY "Users can view own profile" ON users_profile
    FOR SELECT USING ((select auth.uid()) = id AND active = true);

-- Users can update their profile information when they are active
CREATE POLICY "Users can update profile" ON users_profile
    FOR UPDATE USING ((select auth.uid()) = id AND active = true);

-- Users can insert their own profile, and allow system/trigger inserts
CREATE POLICY "Users can insert own profile" ON users_profile
    FOR INSERT WITH CHECK ((select auth.uid()) = id OR (select auth.uid()) IS NULL);

-- FIXED: Storage units policies - consolidated into single policy per operation
-- Consolidated policy for viewing storage units (replaces multiple permissive policies)
CREATE POLICY "Public read access to storage units" ON storage_units
    FOR SELECT TO PUBLIC USING (
        true -- Anyone can view storage units
        OR EXISTS ( -- Admins have full access
            SELECT 1 FROM users_profile 
            WHERE id = (select auth.uid()) 
            AND email IN ('admin@trasteros.com')
        )
    );

-- Admin-only policies for storage units modifications
CREATE POLICY "Admin modify storage units" ON storage_units
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE id = (select auth.uid()) 
            AND email IN ('admin@trasteros.com')
        )
    );

CREATE POLICY "Admin update storage units" ON storage_units
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE id = (select auth.uid()) 
            AND email IN ('admin@trasteros.com')
        )
    );

CREATE POLICY "Admin delete storage units" ON storage_units
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users_profile 
            WHERE id = (select auth.uid()) 
            AND email IN ('admin@trasteros.com')
        )
    );

-- FIXED: Rentals policies with optimized auth.uid() calls
CREATE POLICY "Users and service role can view rentals" ON rentals
    FOR SELECT USING (
        current_setting('role') = 'service_role'
        OR ((select auth.uid()) = user_id AND EXISTS (
            SELECT 1 FROM users_profile 
            WHERE id = (select auth.uid()) AND active = true
        ))
    );

CREATE POLICY "Users and service role can insert rentals" ON rentals
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role' 
        OR ((select auth.uid()) = user_id AND EXISTS (
            SELECT 1 FROM users_profile 
            WHERE id = (select auth.uid()) AND active = true
        ))
    );

CREATE POLICY "Users can update own rentals" ON rentals
    FOR UPDATE USING (
        (select auth.uid()) = user_id AND EXISTS (
            SELECT 1 FROM users_profile 
            WHERE id = (select auth.uid()) AND active = true
        )
    );

-- FIXED: Payments policies with optimized auth.uid() calls
CREATE POLICY "Users and service role can view payments" ON payments
    FOR SELECT USING (
        current_setting('role') = 'service_role'
        OR EXISTS (
            SELECT 1 FROM rentals 
            JOIN users_profile ON users_profile.id = rentals.user_id
            WHERE rentals.id = payments.rental_id 
            AND rentals.user_id = (select auth.uid())
            AND users_profile.active = true
        )
    );

CREATE POLICY "System and service role can insert payments" ON payments
    FOR INSERT WITH CHECK (
        current_setting('role') = 'service_role'
        OR EXISTS (
            SELECT 1 FROM rentals 
            JOIN users_profile ON users_profile.id = rentals.user_id
            WHERE rentals.id = payments.rental_id 
            AND rentals.user_id = (select auth.uid())
            AND users_profile.active = true
        )
    );

-- Add comment documenting the performance optimizations
COMMENT ON POLICY "Users can view own profile" ON users_profile IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users can update profile" ON users_profile IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users can insert own profile" ON users_profile IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Public read access to storage units" ON storage_units IS 'Consolidated policy replacing multiple permissive policies for better performance';
COMMENT ON POLICY "Admin modify storage units" ON storage_units IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Admin update storage units" ON storage_units IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Admin delete storage units" ON storage_units IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users and service role can view rentals" ON rentals IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users and service role can insert rentals" ON rentals IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users can update own rentals" ON rentals IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "Users and service role can view payments" ON payments IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';
COMMENT ON POLICY "System and service role can insert payments" ON payments IS 'Optimized with (select auth.uid()) to prevent per-row re-evaluation';

-- Remove unused indexes to improve performance (INFO level warnings)
-- These indexes are not used by current application queries

-- Users profile unused indexes
DROP INDEX IF EXISTS idx_users_profile_email;
DROP INDEX IF EXISTS idx_users_profile_active; 
DROP INDEX IF EXISTS idx_users_profile_dni;
DROP INDEX IF EXISTS idx_users_profile_postal_code;
DROP INDEX IF EXISTS idx_users_profile_province;
DROP INDEX IF EXISTS idx_users_profile_billing_type;

-- Storage units - remove all unused indexes
DROP INDEX IF EXISTS idx_storage_units_size;
DROP INDEX IF EXISTS idx_storage_units_status;

-- Rentals - remove all unused indexes but keep foreign key index
DROP INDEX IF EXISTS idx_rentals_user_id; -- not used in current environment
DROP INDEX IF EXISTS idx_rentals_status; -- not used in current queries
DROP INDEX IF EXISTS idx_rentals_payment_type; -- not used in current environment
DROP INDEX IF EXISTS idx_rentals_subscription_status; -- not used in current environment
DROP INDEX IF EXISTS idx_rentals_stripe_subscription_id; -- not used in current environment
DROP INDEX IF EXISTS idx_rentals_next_payment_date; -- not queried currently
DROP INDEX IF EXISTS idx_rentals_checkout_session_id; -- not queried currently

-- Fix unindexed foreign key warning for rentals.unit_id
-- This is required to prevent foreign key performance issues
CREATE INDEX IF NOT EXISTS idx_rentals_unit_id ON rentals(unit_id);

-- Payments - remove all unused indexes (including rental_id since it's not used yet)
DROP INDEX IF EXISTS idx_payments_status;
DROP INDEX IF EXISTS idx_payments_payment_type;
DROP INDEX IF EXISTS idx_payments_subscription_id;
DROP INDEX IF EXISTS idx_payments_stripe_invoice_id;
DROP INDEX IF EXISTS idx_payments_next_billing_date;
DROP INDEX IF EXISTS idx_payments_months_paid;
DROP INDEX IF EXISTS idx_payments_total_amount;
DROP INDEX IF EXISTS idx_payments_rental_id;

-- Fix function search path security warnings (WARN level)
-- Set search_path to empty string to prevent SQL injection attacks

-- Fix handle_new_user function
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Fix update_rental_end_date function  
ALTER FUNCTION public.update_rental_end_date() SET search_path = '';

-- Fix update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';

-- Fix calculate_rental_end_date function
ALTER FUNCTION public.calculate_rental_end_date(DATE, INTEGER, VARCHAR(20)) SET search_path = '';

-- Fix deactivate_user_account function
ALTER FUNCTION public.deactivate_user_account() SET search_path = '';

-- Add comment documenting the security fix
COMMENT ON FUNCTION public.handle_new_user() IS 'Enhanced user profile creation trigger supporting OAuth providers (Google, etc.) with comprehensive name field mapping. Security: search_path fixed.';
COMMENT ON FUNCTION public.update_rental_end_date() IS 'Trigger function to automatically set end_date when rental is created/updated. Security: search_path fixed.';
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Generic trigger function to update updated_at timestamp. Security: search_path fixed.';
COMMENT ON FUNCTION public.calculate_rental_end_date(DATE, INTEGER, VARCHAR(20)) IS 'Function to calculate rental end date based on payment type and months paid. Security: search_path fixed.';
COMMENT ON FUNCTION public.deactivate_user_account() IS 'Function to deactivate user account (bypasses RLS). Security: search_path fixed.';

-- Add comment documenting the cleanup
COMMENT ON TABLE storage_units IS 'Removed all unused indexes - will be added back when needed';
COMMENT ON TABLE rentals IS 'Removed all unused indexes except foreign key index for unit_id';
COMMENT ON TABLE payments IS 'Removed all unused indexes - will be added back when usage patterns are established';
COMMENT ON TABLE users_profile IS 'Removed all unused indexes - queries primarily use primary key lookups';