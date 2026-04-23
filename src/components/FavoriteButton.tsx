"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface FavoriteButtonProps {
    entityId: string;
    entityType: "business" | "service";
    className?: string;
}

export default function FavoriteButton({ entityId, entityType, className = "" }: FavoriteButtonProps) {
    const supabase = createClient();
    const { showToast } = useToast();
    const [isFavorited, setIsFavorited] = useState(false);
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatus = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUserId(user?.id || null);

            // Fetch Total Count
            const countColumn = entityType === "business" ? "business_id" : "service_id";
            const { count: totalCount, error: countError } = await supabase
                .from('favorites')
                .select('*', { count: 'exact', head: true })
                .eq(countColumn, entityId);

            if (!countError && totalCount !== null) {
                setCount(totalCount);
            }

            // Check if favorited by user
            if (user) {
                const { data, error } = await supabase
                    .from('favorites')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq(countColumn, entityId)
                    .maybeSingle();

                if (data && !error) {
                    setIsFavorited(true);
                }
            }
            
            setLoading(false);
        };

        fetchStatus();
    }, [entityId, entityType, supabase]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!userId) {
            // Might want to alert user to log in first, but let's just ignore or prompt
            showToast("Please log in to save favorites.", "error");
            return;
        }

        const countColumn = entityType === "business" ? "business_id" : "service_id";

        if (isFavorited) {
            // Unfavorite
            setIsFavorited(false);
            setCount((prev) => Math.max(0, prev - 1));
            
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', userId)
                .eq(countColumn, entityId);
                
            if (error) {
                console.error("Error removing favorite:", error);
                // Revert optimistic update
                setIsFavorited(true);
                setCount((prev) => prev + 1);
            }
        } else {
            // Favorite
            setIsFavorited(true);
            setCount((prev) => prev + 1);
            
            const { error } = await supabase
                .from('favorites')
                .insert({
                    user_id: userId,
                    [countColumn]: entityId,
                });
                
            if (error) {
                console.error("Error adding favorite:", error);
                // Revert optimistic update
                setIsFavorited(false);
                setCount((prev) => Math.max(0, prev - 1));
            }
        }
    };

    return (
        <button
            onClick={toggleFavorite}
            disabled={loading}
            className={`group flex items-center gap-2 ${className}`}
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
            <Heart 
                className={`w-5 h-5 transition-colors ${
                    isFavorited 
                        ? "fill-red-500 text-red-500" 
                        : "text-black dark:text-white group-hover:fill-red-500 group-hover:text-red-500"
                }`} 
            />
            {count > 0 && (
                <span className="text-sm font-bold opacity-70 group-hover:opacity-100 transition-opacity">
                    {new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(count)}
                </span>
            )}
        </button>
    );
}
