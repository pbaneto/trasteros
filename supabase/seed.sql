-- Seed data for Trasteros storage rental app

-- Insert sample storage units
INSERT INTO storage_units (unit_number, size_m2, price) VALUES
    -- 2m² units (7 units)
    ('A001', 2, 75.00),
    ('A002', 2, 75.00),
    ('A003', 2, 75.00),
    ('A004', 2, 75.00),
    ('A005', 2, 75.00),
    ('A006', 2, 75.00),
    ('A007', 2, 75.00),
    -- 3m² units (7 units)
    ('B001', 3, 100.00),
    ('B002', 3, 100.00),
    ('B003', 3, 100.00),
    ('B004', 3, 100.00),
    ('B005', 3, 100.00),
    ('B006', 3, 100.00),
    ('B007', 3, 100.00),
    -- 5m² units (7 units)
    ('C001', 5, 125.00),
    ('C002', 5, 125.00),
    ('C003', 5, 125.00),
    ('C004', 5, 125.00),
    ('C005', 5, 125.00),
    ('C006', 5, 125.00),
    ('C007', 5, 125.00),
    -- 6m² units (7 units)
    ('D001', 6, 150.00),
    ('D002', 6, 150.00),
    ('D003', 6, 150.00),
    ('D004', 6, 150.00),
    ('D005', 6, 150.00),
    ('D006', 6, 150.00),
    ('D007', 6, 150.00)
ON CONFLICT (unit_number) DO NOTHING;

-- Set some units as occupied for demo purposes
UPDATE storage_units 
SET status = 'occupied' 
WHERE unit_number IN ('A001', 'B001', 'C001');