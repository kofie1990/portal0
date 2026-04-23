
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("Paystack Init Body:", body);
        const { email, amount, subaccount, transaction_charge, metadata } = body;

        // transaction_charge (in pesewas) and subaccount are used below
        // after adjusting for the Paystack fee to ensure correct splits.

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
        const totalPesewas = Math.round(totalAmountToCharge * 100);

        // When using subaccounts with bearer: "account":
        //   - Paystack gives subaccount: (total_charged - transaction_charge)
        //   - Paystack gives main account: (transaction_charge - paystack_fee)
        //
        // So to ensure the provider gets EXACTLY their booking fee (not the inflated amount),
        // transaction_charge must be: totalPesewas - bookingFeePesewas
        // This way: provider gets totalPesewas - adjustedCharge = bookingFeePesewas ✓
        // And platform gets: adjustedCharge - paystackFee ≈ platformFee ✓
        let adjustedTransactionCharge = transaction_charge || 0;
        if (subaccount && transaction_charge) {
            const bookingFeePesewas = Math.round(amount * 100) - transaction_charge; // amount includes platform fee
            adjustedTransactionCharge = totalPesewas - bookingFeePesewas;
        }

        // Override subParams with the corrected transaction_charge
        const subParams = subaccount
            ? {
                subaccount,
                transaction_charge: adjustedTransactionCharge,
                bearer: "account",
            }
            : {};

        const params = {
            email,
            amount: totalPesewas,
            currency: "GHS",
            callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/book/callback?vendorId=${metadata.vendorId}`,
            metadata: {
                ...metadata,
                original_amount_charged: amount, // keep track of true cost for reporting if needed
                platform_fee: transaction_charge ? transaction_charge / 100 : 0, // store original platform fee in GH₵
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
