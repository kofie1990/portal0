'use server';

import { createSubaccount, getBanks, resolveAccount, SubaccountPayload } from "@/lib/paystack";

export async function fetchBanksAction(currency: 'GHS' | 'NGN' = 'GHS') {
    try {
        const banks = await getBanks(currency);
        return { data: banks };
    } catch (error: any) {
        return { error: error.message || "Failed to fetch banks" };
    }
}

export async function verifyAccountAction(accountNumber: string, bankCode: string) {
    try {
        const account = await resolveAccount(accountNumber, bankCode);
        return { data: account };
    } catch (error: any) {
        return { error: error.message || "Could not verify account details" };
    }
}

export async function createSubaccountAction(
    businessName: string,
    bankCode: string,
    accountNumber: string,
    description?: string,
    email?: string
) {
    try {
        // Enforce 10% platform fee by setting percentage_charge to 10
        const payload: SubaccountPayload = {
            business_name: businessName,
            settlement_bank: bankCode,
            account_number: accountNumber,
            percentage_charge: 10, // 10% Platform Fee
            description: description || `Subaccount for ${businessName}`,
            primary_contact_email: email
        };

        const subaccount = await createSubaccount(payload);
        return { data: subaccount };
    } catch (error: any) {
        console.error("Subaccount creation failed:", error);
        return { error: error.message || "Failed to create subaccount" };
    }
}
