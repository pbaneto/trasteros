-- Seed data for Trasteros storage rental app

-- Insert sample storage units
INSERT INTO storage_units (unit_number, size_m2, monthly_price) VALUES
    ('A001', 2, 45.00),
    ('A002', 2, 45.00),
    ('A003', 2, 45.00),
    ('A004', 4, 45.00),
    ('A005', 4, 45.00),
    ('A006', 4, 45.00),
    ('A007', 6, 45.00),
    ('A008', 6, 45.00),
    ('A009', 6, 45.00),
    ('A010', 2, 45.00),
    ('A011', 2, 45.00),
    ('A012', 4, 45.00),
    ('A013', 4, 45.00),
    ('A014', 6, 45.00),
    ('A015', 6, 45.00)
ON CONFLICT (unit_number) DO NOTHING;

-- Set some units as occupied for demo purposes
UPDATE storage_units 
SET status = 'occupied' 
WHERE unit_number IN ('A001', 'A002', 'A003');