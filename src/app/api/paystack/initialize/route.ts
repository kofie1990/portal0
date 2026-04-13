
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Paystack Init Body:", body);
        const { email, amount, subaccount, metadata } = body;

        const subParams = subaccount ? { subaccount, bearer: "subaccount" } : {};

        // [TEST BYPASS] Mock Initialization
        if (subaccount && subaccount.startsWith("ACCT_MOCK_")) {
            console.log("Mock Paystack Init for:", subaccount);
            const mockRef = `MOCK_REF_${metadata.booking_id}_${Date.now()}`;
            // Redirect directly to callback as if payment succeeded
            const mockAuthUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/callback?vendorId=${metadata.vendorId}&reference=${mockRef}`;

            return NextResponse.json({
                authorization_url: mockAuthUrl,
                access_code: `MOCK_ACCESS_${Date.now()}`,
                reference: mockRef
            });
        }

        // Paystack Ghana Fee Structure: 1.95% per transaction
        // To pass the charge to the customer, we calculate the total amount required
        // so that the remaining amount after the percentage deduction is exactly the original amount.
        // Formula: Final Amount = Target Amount / (1 - Fee Percentage)
        const PAYSTACK_FEE_RATE = 0.0195;
        const totalAmountToCharge = amount / (1 - PAYSTACK_FEE_RATE);

        const params = {
            email,
            amount: Math.round(totalAmountToCharge * 100), // Convert to pesewas AND round to integer
            currency: "GHS",
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/callback?vendorId=${metadata.vendorId}`,
            metadata: {
                ...metadata,
                original_amount_charged: amount // keep track of true cost for reporting if needed
            },
            ...subParams,
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
            console.error("Paystack API Error:", data);
            return NextResponse.json({ error: data.message }, { status: 400 });
        }

        return NextResponse.json(data.data);
    } catch (error: any) {
        console.error('Paystack Init Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
