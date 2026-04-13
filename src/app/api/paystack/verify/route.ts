import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendBookingConfirmedEmail } from '@/app/actions/booking';

// We need a service role client to update bookings securely without RLS issues if the user is not logged in context (webhook/callback)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    if (!reference) {
        return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
    }

    try {
        let transaction;

        // [TEST BYPASS] Mock Verification
        if (reference.startsWith("MOCK_REF_")) {
            // Extract bookingId from MOCK_REF_<bookingId>_<timestamp>
            const parts = reference.split('_');
            // MOCK, REF, bookingId, timestamp...
            // Booking ID is parts[2]
            const mockBookingId = parts[2];

            if (!mockBookingId) return NextResponse.json({ error: 'Invalid Mock Reference' }, { status: 400 });

            // Mock successful transaction data
            transaction = {
                status: 'success',
                amount: 1000, // Dummy amount
                metadata: { booking_id: mockBookingId }
            };
        } else {
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

            transaction = paystackData.data;
        }

        const bookingId = transaction.metadata?.booking_id;

        if (!bookingId) {
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

        // 3. Send Booking Confirmed Email (Includes guests!)
        await sendBookingConfirmedEmail(bookingId);

        return NextResponse.json({ success: true, bookingId });

    } catch (error: any) {
        console.error('Verify Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
