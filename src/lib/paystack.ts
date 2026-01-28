
export const PAYSTACK_API_URL = 'https://api.paystack.co';

export interface PaystackBank {
    name: string;
    slug: string;
    code: string;
    longcode: string;
    gateway: string | null;
    pay_with_bank: boolean;
    active: boolean;
    is_deleted: boolean;
    country: string;
    currency: string;
    type: string;
    id: number;
    createdAt: string;
    updatedAt: string;
}

export interface PaystackAccountResolveResponse {
    account_number: string;
    account_name: string;
    bank_id: number;
}

export interface SubaccountPayload {
    business_name: string;
    settlement_bank: string; // Bank Code
    account_number: string;
    percentage_charge: number;
    description?: string;
    primary_contact_email?: string;
    primary_contact_name?: string;
    primary_contact_phone?: string;
    metadata?: any;
}

export interface SubaccountResponse {
    subaccount_code: string;
    account_number: string;
    percentage_charge: number;
    active: boolean;
    id: number;
    integration: number;
    domain: string;
    currency: string;
    settlement_bank: string;
    business_name: string;
    description: string | null;
    primary_contact_email: string | null;
    primary_contact_name: string | null;
    primary_contact_phone: string | null;
    metadata: any | null;
    bank_id: number;
    is_verified: boolean;
    settlement_schedule: string;
    created_at: string;
    updated_at: string;
}

/**
 * Fetch list of banks and mobile money providers
 */
export async function getBanks(currency: 'GHS' | 'NGN' = 'GHS'): Promise<PaystackBank[]> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("Missing PAYSTACK_SECRET_KEY");

    // Fetch both banks and mobile money if relevant, or just use general endpoint
    // Paystack 'bank' endpoint with param ?currency=GHS returns both banks and momo usually, or we can filter
    const response = await fetch(`${PAYSTACK_API_URL}/bank?currency=${currency}`, {
        headers: {
            Authorization: `Bearer ${secretKey}`,
        },
        next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch banks: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data;
}

/**
 * Resolve Account Number
 */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<PaystackAccountResolveResponse> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("Missing PAYSTACK_SECRET_KEY");

    const response = await fetch(`${PAYSTACK_API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, {
        headers: {
            Authorization: `Bearer ${secretKey}`,
        },
    });

    if (!response.ok) {
        // Paystack returns 422 for invalid accounts often, so handle it gracefully
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || `Failed to verify account: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data;
}

/**
 * Create Subaccount
 */
export async function createSubaccount(payload: SubaccountPayload): Promise<SubaccountResponse> {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) throw new Error("Missing PAYSTACK_SECRET_KEY");

    const response = await fetch(`${PAYSTACK_API_URL}/subaccount`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || `Failed to create subaccount: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data;
}
