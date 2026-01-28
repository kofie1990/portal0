"use client";

import { useState, useEffect } from "react";
import { Loader2, Check } from "lucide-react";
import { fetchBanksAction, verifyAccountAction } from "@/app/actions/paystack";
import { PaystackBank } from "@/lib/paystack";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface StepPayoutProps {
    bankCode: string;
    setBankCode: (val: string) => void;
    accountNumber: string;
    setAccountNumber: (val: string) => void;
    accountName: string;
    setAccountName: (val: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function StepPayout({
    bankCode, setBankCode,
    accountNumber, setAccountNumber,
    accountName, setAccountName,
    onNext, onBack
}: StepPayoutProps) {
    const [banks, setBanks] = useState<PaystackBank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentType, setPaymentType] = useState<'nuban' | 'mobile_money'>('nuban');

    useEffect(() => {
        fetchBanksAction().then(res => {
            if (res.data) setBanks(res.data);
            setLoadingBanks(false);
        });
    }, []);

    useEffect(() => {
        if (bankCode && accountNumber && accountNumber.length >= 10) {
            setResolving(true);
            setError(null);
            verifyAccountAction(accountNumber, bankCode).then(res => {
                if (res.data) {
                    setAccountName(res.data.account_name);
                } else {
                    setAccountName("");
                    setError(res.error || "Could not verify account.");
                }
                setResolving(false);
            });
        }
    }, [bankCode, accountNumber, setAccountName]);

    const filteredBanks = banks.filter(b => {
        if (paymentType === 'nuban') return b.type !== 'mobile_money';
        if (paymentType === 'mobile_money') return b.type === 'mobile_money';
        return true;
    });

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="glass-panel p-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl bg-white/50 dark:bg-black/50"
        >
            <h2 className="font-heading text-3xl font-bold mb-2">Payout Details</h2>
            <p className="text-neutral-500 mb-8">Set up your account to receive payments from bookings.</p>

            <div className="flex gap-4 mb-6">
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

            <div className="space-y-6 mb-10">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500 ml-1">BANK / PROVIDER</label>
                    <div className="relative">
                        <select
                            value={bankCode}
                            onChange={(e) => setBankCode(e.target.value)}
                            className="w-full bg-neutral-100 dark:bg-neutral-900 border-none px-5 py-4 rounded-xl text-base outline-none focus:ring-2 ring-black dark:ring-white transition-all appearance-none"
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

                <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500 ml-1">ACCOUNT NUMBER</label>
                    <input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none px-5 py-4 rounded-xl text-base outline-none focus:ring-2 ring-black dark:ring-white transition-all"
                        placeholder="e.g. 054xxxxxxx"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-neutral-500 ml-1">ACCOUNT NAME</label>
                    <div className="relative">
                        <input
                            value={error ? "Verification Failed" : accountName}
                            readOnly
                            className={`w-full bg-neutral-100 dark:bg-neutral-800 border-none px-5 py-4 rounded-xl text-base outline-none font-bold ${error ? 'text-red-500' : 'text-neutral-500'}`}
                            placeholder={resolving ? "Verifying..." : "Account holder name will appear here..."}
                        />
                        {resolving && <Loader2 className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />}
                        {!resolving && !error && accountName && <Check className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                    </div>
                    {error && <p className="text-xs text-red-500 font-bold ml-1">{error}</p>}
                </div>
            </div>

            <div className="flex justify-between items-center">
                <button onClick={onBack} className="text-sm font-bold text-neutral-400 hover:text-black dark:hover:text-white transition-colors">
                    BACK
                </button>
                <button
                    onClick={onNext}
                    disabled={!accountName || !bankCode || !accountNumber}
                    className="bg-foreground text-background px-8 py-3 rounded-full font-bold tracking-wide hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    NEXT <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
