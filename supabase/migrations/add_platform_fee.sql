-- Migration: Add platform_fee column to bookings table
-- This column stores the platform commission charged to the customer on each booking.
-- The value is in GH₵ (main currency unit, not pesewas).

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS platform_fee DECIMAL DEFAULT 0;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN bookings.platform_fee IS 'Platform commission charged to the booking customer, in GH₵. 10% of booking fee or flat GH₵5 if no fee set.';
