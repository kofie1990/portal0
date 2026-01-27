"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface FileUploadProps {
    value?: string;
    onChange: (url: string) => void;
    label: string;
    bucket?: string;
    className?: string;
}

export default function FileUpload({ value, onChange, label, bucket = "business-media", className }: FileUploadProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
            onChange(data.publicUrl);

        } catch (error: any) {
            console.error("Error uploading file:", error);
            alert("Error uploading file: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = () => {
        onChange("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className={`space-y-2 ${className}`}>
            <label className="text-sm font-bold flex items-center gap-2 uppercase">
                <ImageIcon className="w-4 h-4" /> {label}
            </label>

            <div
                onClick={() => !value && fileInputRef.current?.click()}
                className={`relative w-full h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all overflow-hidden ${value ? "border-transparent" : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 cursor-pointer bg-neutral-50 dark:bg-neutral-900"
                    }`}
            >
                {uploading ? (
                    <div className="flex flex-col items-center gap-2 text-neutral-500">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-bold">Uploading...</span>
                    </div>
                ) : value ? (
                    <>
                        <Image
                            src={value}
                            alt="Uploaded"
                            fill
                            className="object-cover"
                        />
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-neutral-400">
                        <Upload className="w-8 h-8" />
                        <span className="text-xs font-bold">CLICK TO UPLOAD</span>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                />
            </div>
        </div>
    );
}
