"use client";

import { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { Loader2, Check } from "lucide-react";
import { fetchBanksAction, verifyAccountAction } from "@/app/actions/paystack";
import { PaystackBank } from "@/lib/paystack";

export default function PayoutSection({ control, watch, setValue }: any) {
    const [banks, setBanks] = useState<PaystackBank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentType, setPaymentType] = useState<'nuban' | 'mobile_money'>('nuban');

    const bankCode = watch('bankCode');
    const accountNumber = watch('accountNumber');

    useEffect(() => {
        fetchBanksAction().then(res => {
            if (res.data) setBanks(res.data);
            setLoadingBanks(false);
        });
    }, []);

    // Verify account when both fields are present
    useEffect(() => {
        if (bankCode && accountNumber && accountNumber.length >= 10) {
            setResolving(true);
            setError(null);
            verifyAccountAction(accountNumber, bankCode).then(res => {
                if (res.data) {
                    setValue('accountName', res.data.account_name, { shouldValidate: true });
                } else {
                    setValue('accountName', '', { shouldValidate: true });
                    setError(res.error || "Could not verify account.");
                }
                setResolving(false);
            });
        }
    }, [bankCode, accountNumber, setValue]);

    const filteredBanks = banks.filter(b => {
        if (paymentType === 'nuban') return b.type !== 'mobile_money';
        if (paymentType === 'mobile_money') return b.type === 'mobile_money';
        return true;
    });

    return (
        <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
            <h3 className="font-bold text-lg mb-4">Payout Details</h3>
            <p className="text-sm text-neutral-500 mb-4">Where should we send your earnings? Payments are processed automatically.</p>

            {/* Payment Type Toggle */}
            <div className="flex gap-4 mb-4">
                <button
                    type="button"
                    onClick={() => setPaymentType('nuban')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${paymentType === 'nuban' ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'border-neutral-200 text-neutral-500 hover:border-black'}`}
                >
                    Bank Account
                </button>
                <button
                    type="button"
                    onClick={() => setPaymentType('mobile_money')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${paymentType === 'mobile_money' ? 'bg-black text-white border-black dark:bg-white dark:text-black' : 'border-neutral-200 text-neutral-500 hover:border-black'}`}
                >
                    Mobile Money
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Select */}
                <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">BANK / MO. MONEY PROVIDER</label>
                    <div className="relative">
                        <select
                            {...control.register('bankCode')}
                            className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors appearance-none"
                        >
                            <option value="">Select Provider...</option>
                            {loadingBanks ? <option>Loading...</option> : filteredBanks.map(b => (
                                <option key={b.code} value={b.code}>{b.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Account Number */}
                <Controller
                    name="accountNumber"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2">
                            <label className="text-sm font-bold ml-1">ACCOUNT NUMBER</label>
                            <input
                                {...field}
                                className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl px-5 py-4 outline-none focus:border-black dark:focus:border-white transition-colors"
                                placeholder="e.g. 054xxxxxxx"
                            />
                        </div>
                    )}
                />

                {/* Account Name (Read Only) */}
                <Controller
                    name="accountName"
                    control={control}
                    render={({ field }) => (
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold ml-1">ACCOUNT NAME</label>
                            <div className="relative">
                                <input
                                    {...field}
                                    readOnly
                                    className={`w-full bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl px-5 py-4 outline-none font-bold ${error ? 'text-red-500' : 'text-neutral-500'}`}
                                    placeholder={resolving ? "Verifying..." : "Account holder name will appear here..."}
                                    value={error ? "Verification Failed" : field.value}
                                />
                                {resolving && <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />}
                                {!resolving && !error && field.value && <Check className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                            </div>
                            {error && <p className="text-xs text-red-500 font-bold ml-1 mt-1">{error}</p>}
                        </div>
                    )}
                />
            </div>
        </div>
    );
}
