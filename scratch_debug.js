import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://aacvuwhdkeufhbgplxym.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhY3Z1d2hka2V1ZmhiZ3BseHltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzk0Njg1NSwiZXhwIjoyMDgzNTIyODU1fQ.Ru4IlOjngccGmcSBI97lQ9Vl93woSmnyB7kgK7qGTjU'
);

async function check() {
  const { data, error } = await supabase.rpc('get_policies' /* if they have one? no */);
  // We can't query pg_policies via supabase-js directly without a function or being a superuser on raw SQL connection
  
  // Let's try to insert using anon key just to reproduce locally
  const anonClient = createClient(
      'https://aacvuwhdkeufhbgplxym.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhY3Z1d2hka2V1ZmhiZ3BseHltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDY4NTUsImV4cCI6MjA4MzUyMjg1NX0.uAQGiq5Gmb57DM3S68wqOVesGxPa05bKMlNWJD7DzTo'
  )
  
  const { data: insData, error: insErr } = await anonClient.from('bookings').insert({
      user_id: null,
      service_id: 'db28db15-3736-477d-bbd9-95e54d86c757', // fake
      booking_date: new Date().toISOString(),
      total_amount: 100,
      status: 'pending_payment'
  }).select();
  console.log('Anon insert:', insErr || insData);
  
}
check();
