"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, X } from "lucide-react";
import { createContext, useContext, useState, ReactNode } from "react";

type ToastType = 'success' | 'error';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);

        setTimeout(() => {
            removeToast(id);
        }, 5000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            layout
                            className={`min-w-[300px] p-4 rounded-xl shadow-2xl border flex items-start gap-3 backdrop-blur-xl ${toast.type === 'success'
                                    ? 'bg-white/90 dark:bg-neutral-900/90 border-green-200 dark:border-green-900'
                                    : 'bg-white/90 dark:bg-neutral-900/90 border-red-200 dark:border-red-900'
                                }`}
                        >
                            <div className={`mt-0.5 ${toast.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                                {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-bold ${toast.type === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                    {toast.type === 'success' ? 'Success' : 'Error'}
                                </h4>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{toast.message}</p>
                            </div>
                            <button onClick={() => removeToast(toast.id)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
