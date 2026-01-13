
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, amount, subaccount, metadata } = body;

        const params = {
            email,
            amount: amount * 100, // Convert to kobo/pesewas
            currency: "GHS",
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/callback?vendorId=${metadata.vendorId}`,
            metadata,
            ...(subaccount && { subaccount }), // Split payment if subaccount exists
            // If using split payment with subaccount, we might need 'bearer' or 'transaction_charge' logic depending on platform fees.
            // For now, simple split.
        };

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        const data = await response.json();

        if (!data.status) {
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        return NextResponse.json(data.data);
    } catch (error: any) {
        console.error('Paystack Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
