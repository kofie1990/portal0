'use server';

import { createClient } from '@/lib/supabase/server';
import { BookingConfirmedEmailHtml } from '@/lib/email_templates/BookingConfirmed';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Admin client to bypass RLS for guest bookings securely
const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function createBookingAction(bookingData: any) {
    const { data, error } = await supabaseAdmin
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
        
    if (error) return { error: error.message };
    return { data };
}

export async function fetchServiceBookings(serviceId: string, startDate: string, endDate: string) {
    const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('booking_date, service_id, status')
        .eq('service_id', serviceId)
        .in('status', ['pending_payment', 'confirmed'])
        .gte('booking_date', startDate)
        .lte('booking_date', endDate);
        
    if (error) return { error: error.message };
    return { data };
}

export async function fetchBusinessBookings(businessId: string, startDate: string, endDate: string) {
    const { data, error } = await supabaseAdmin
        .from('bookings')
        .select('booking_date, service_id, status')
        .eq('business_id', businessId)
        .in('status', ['pending_payment', 'confirmed'])
        .gte('booking_date', startDate)
        .lte('booking_date', endDate);
        
    if (error) return { error: error.message };
    return { data };
}

export async function confirmBooking(bookingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized' };
    }

    // 1. Fetch Booking and verify ownership
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select(`
            *,
            services (name, price_amount, price_currency),
            profiles:user_id (email, full_name),
            provider_profile:provider_id (full_name),
            business:business_id (name, owner_id, booking_policies)
        `)
        .eq('id', bookingId)
        .single();

    if (fetchError || !booking) {
        return { error: 'Booking not found' };
    }

    // Check if user is the provider or business owner
    const isProvider = booking.provider_id === user.id;
    const isBusinessOwner = booking.business?.owner_id === user.id;

    if (!isProvider && !isBusinessOwner) {
        return { error: 'You are not authorized to confirm this booking' };
    }

    // 2. Update Booking Status
    const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

    if (updateError) {
        return { error: 'Failed to update booking status' };
    }

    // 3. Send Email
    await sendBookingConfirmedEmail(bookingId);

    return { success: true };
}

export async function sendBookingConfirmedEmail(bookingId: string) {
    const supabase = await createClient(); // Use standard client or admin if needed. For server actions, standard is fine if RLS allows reading bookings.
    // Better to use Admin client to ensure we can always fetch the details to send the email
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: booking, error } = await supabaseAdmin
        .from('bookings')
        .select(`
            *,
            services (name, price_amount, price_currency),
            profiles:user_id (email, full_name),
            provider_profile:provider_id (full_name),
            business:business_id (name, owner_id, booking_policies)
        `)
        .eq('id', bookingId)
        .single();
        
    if (error || !booking) return { error: 'Booking not found' };

    try {
        const customerEmail = booking.profiles?.email || booking.guest_email;
        if (customerEmail) {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'Portal <admin@mail.myportalgh.com>', // Use verified domain in prod
                    to: [customerEmail],
                    subject: 'Booking Confirmed!',
                    html: BookingConfirmedEmailHtml({
                        customerName: booking.profiles?.full_name || booking.guest_name || 'Customer',
                        serviceName: booking.services?.name || 'Service',
                        providerName: booking.business?.name || booking.provider_profile?.full_name || 'Provider',
                        date: new Date(booking.booking_date).toLocaleString(),
                        amountPaid: `${booking.services?.price_currency || 'GH₵'} ${booking.amount_paid || 0}`,
                        bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
                        bookingPolicies: booking.business?.booking_policies || null
                    })
                })
            });

            if (!res.ok) {
                const emailError = await res.json();
                console.error('Resend Error:', emailError);
            }
        }
    } catch (e) {
        console.error('Email sending failed', e);
    }


    return { success: true };
}

export async function completeBooking(bookingId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // 1. Fetch Booking and verify ownership
    // Completion is usually confirmed by the USER (Customer) to say "Yes, work done" 
    // OR by Provider.
    // The prompt says: "button to confirm completion of service and ability give review"
    // Usually, User confirms completion so they can review. 
    // Let's allow User to mark as completed.

    const { data: booking, error } = await supabase.from('bookings').select('user_id').eq('id', bookingId).single();

    if (error || !booking) return { error: 'Booking not found' };

    if (booking.user_id !== user.id) {
        return { error: 'Only the customer can mark this booking as completed.' };
    }

    const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

    if (updateError) return { error: 'Failed to complete booking' };

    return { success: true };
}

export async function submitReview(bookingId: string, rating: number, comment: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // 1. Validate Booking
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

    if (fetchError || !booking) return { error: 'Booking not found' };

    if (booking.user_id !== user.id) {
        return { error: 'You can only review your own bookings.' };
    }

    if (booking.status !== 'completed') {
        return { error: 'You can only review completed bookings.' };
    }

    // 2. Insert Review
    const { error: insertError } = await supabase.from('reviews').insert({
        user_id: user.id,
        business_id: booking.business_id,
        reviewed_profile_id: booking.provider_id, // If it was a generic booking, this might be null? Schema check: target check ensures one is set.
        rating,
        comment
    });

    if (insertError) {
        console.error(insertError);
        return { error: 'Failed to submit review' };
    }

    return { success: true };
}
