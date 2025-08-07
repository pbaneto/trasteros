-- Simplified user profile creation trigger
-- This migration ensures the user profile is created reliably after auth user creation

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a simple, reliable function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the trigger execution
    RAISE LOG 'Creating profile for user: %', NEW.id;
    
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
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'phone',
        false
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE LOG 'Profile handling completed for user: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth user creation
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment explaining the trigger
COMMENT ON FUNCTION public.handle_new_user() IS 'Simple user profile creation trigger with conflict handling';