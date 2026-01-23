import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createClient as createAdminClient } from '@supabase/supabase-js';

// We need a service role client to update bookings securely without RLS issues if the user is not logged in context (webhook/callback)
// However, since this is a GET callback where the user is redirected, we might have their session. 
// But Paystack verification *should* ideally be robust.
// For simplicity in this "callback" flow (frontend redirects here or calls this), we'll try to use the user's session first, 
// or fall back to admin if we want to be sure. 
// Actually, let's stick to the plan: This route verifies the transaction.

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

    try {
        // 1. Verify with Paystack
        const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const paystackData = await paystackRes.json();

        if (!paystackData.status || paystackData.data.status !== 'success') {
            return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
        }

        const transaction = paystackData.data;
        // The booking ID should be in the metadata if we put it there during initialize
        // OR we can find the booking by looking up if we stored the reference (if we did).
        // Best practice: Store reference when initializing OR pass booking ID in metadata.

        // Let's assume we pass booking_id in metadata
        const bookingId = transaction.metadata?.booking_id;

        if (!bookingId) {
            // Fallback: This might be a "deposit" for a booking we haven't created yet? 
            // In the plan, we create booking with 'pending_payment' BEFORE init. 
            // So metadata MUST have booking_id.
            return NextResponse.json({ error: 'No booking ID in transaction metadata' }, { status: 400 });
        }

        // 2. Update Supabase
        // Use Admin client to bypass RLS potentially if the user session is wonky, but standard client might work if user is logged in.
        // SAFE OPTION: Service Role Key for backend updates.
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabaseAdmin
            .from('bookings')
            .update({
                status: 'confirmed',
                paystack_reference: reference,
                amount_paid: transaction.amount / 100, // Convert back to main currency unit
                // Optionally update metadata or notes
            })
            .eq('id', bookingId);

        if (error) {
            console.error('Supabase Update Error:', error);
            return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
        }

        return NextResponse.json({ success: true, bookingId });

    } catch (error: any) {
        console.error('Verify Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
