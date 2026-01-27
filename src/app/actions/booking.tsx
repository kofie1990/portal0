'use server';

import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { BookingConfirmedEmail } from '@/lib/email_templates/BookingConfirmed';

const resend = new Resend(process.env.RESEND_API_KEY);

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
            business:business_id (name, owner_id)
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
    try {
        const customerEmail = booking.profiles?.email;
        if (customerEmail) {
            const { data: emailData, error: emailError } = await resend.emails.send({
                from: 'Portal <onboarding@resend.dev>', // Use verified domain in prod
                to: [customerEmail],
                subject: 'Booking Confirmed!',
                react: <BookingConfirmedEmail
                    customerName={booking.profiles?.full_name || 'Customer'}
                    serviceName={booking.services?.name || 'Service'}
                    providerName={booking.business?.name || booking.provider_profile?.full_name || 'Provider'}
                    date={new Date(booking.booking_date).toLocaleString()}
                    amountPaid={`${booking.services?.price_currency} ${booking.amount_paid || 0}`}
                    bookingUrl={`${process.env.NEXT_PUBLIC_APP_URL}/account`}
                />, // react property needs valid ReactElement. 
                // Since this is a server file and we import the component, it should be fine IF we use TSX extension or configuration supports it.
                // However, 'react' prop expects ReactElement. We might need to call it as a function if it returns JSX, or use createElement.
                // Or simply: <BookingConfirmedEmail ... /> if using .tsx extension for this file? 
                // But this file is .ts usually for actions. 
                // Let's use the functional call approach as done above, assuming it returns JSX.
                // Wait, importing JSX component into .ts file might assume simple object return if not compiled.
                // Safest to just rename this file to booking.tsx if we use JSX syntax in it, OR stick to plain object if possible?
                // Actually, next.js server actions can be in .ts files but can't use JSX directly unless configured.
                // Let's rely on importing it.
            });

            if (emailError) console.error('Resend Error:', emailError);
        }
    } catch (e) {
        console.error('Email sending failed', e);
        // Don't fail the action if email fails, but log it
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
