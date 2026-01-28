export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    updated_at: string | null
                    full_name: string | null
                    avatar_url: string | null
                    role: 'user' | 'business' | 'admin'
                    onboarding_completed: boolean
                    interests: string[] | null
                    phone: string | null
                    bio: string | null
                    email: string | null
                    location_text: string | null // Added
                    lat: number | null
                    lng: number | null
                    paystack_subaccount_code: string | null // Added
                }
                Insert: {
                    id: string
                    updated_at?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'user' | 'business' | 'admin'
                    onboarding_completed?: boolean
                    interests?: string[] | null
                    phone?: string | null
                    bio?: string | null
                    email?: string | null
                    location_text?: string | null // Added
                    paystack_subaccount_code?: string | null // Added
                }
                Update: {
                    id?: string
                    updated_at?: string | null
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: 'user' | 'business' | 'admin'
                    onboarding_completed?: boolean
                    interests?: string[] | null
                    phone?: string | null
                    bio?: string | null
                    email?: string | null
                    location_text?: string | null // Added
                    paystack_subaccount_code?: string | null // Added
                }
            }
            businesses: {
                Row: {
                    id: string
                    created_at: string
                    owner_id: string
                    name: string
                    category: string | null
                    bio: string | null
                    description: string | null
                    location_address: string | null
                    lat: number | null
                    lng: number | null
                    location_type: 'physical' | 'mobile'
                    phone: string | null
                    email: string | null
                    website: string | null
                    iframe_map_url: string | null
                    image_url: string | null
                    cover_image_url: string | null
                    social_links: Json | null
                    paystack_subaccount_code: string | null
                    deposit_fee: number | null
                    open_now: boolean | null
                    is_verified: boolean | null
                    rating: number | null
                    review_count: number | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    owner_id: string
                    name: string
                    category?: string | null
                    bio?: string | null
                    description?: string | null
                    location_address?: string | null
                    lat?: number | null
                    lng?: number | null
                    location_type?: 'physical' | 'mobile'
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    iframe_map_url?: string | null
                    image_url?: string | null
                    cover_image_url?: string | null
                    social_links?: Json | null
                    paystack_subaccount_code?: string | null
                    deposit_fee?: number | null
                    open_now?: boolean | null
                    is_verified?: boolean | null
                    rating?: number | null
                    review_count?: number | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    owner_id?: string
                    name?: string
                    category?: string | null
                    bio?: string | null
                    description?: string | null
                    location_address?: string | null
                    lat?: number | null
                    lng?: number | null
                    location_type?: 'physical' | 'mobile'
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    iframe_map_url?: string | null
                    image_url?: string | null
                    cover_image_url?: string | null
                    social_links?: Json | null
                    paystack_subaccount_code?: string | null
                    deposit_fee?: number | null
                    open_now?: boolean | null
                    is_verified?: boolean | null
                    rating?: number | null
                    review_count?: number | null
                }
            }
            services: {
                Row: {
                    id: string
                    created_at: string
                    business_id: string | null
                    profile_id: string | null
                    name: string
                    description: string | null
                    price_amount: number
                    price_currency: string | null
                    duration_text: string | null
                    duration_minutes: number | null
                    category: string | null
                    image_url: string | null
                    images: string[] | null
                    location_text: string | null
                    deposit_amount: number | null // Added
                }
                Insert: {
                    id?: string
                    created_at?: string
                    business_id?: string | null
                    profile_id?: string | null
                    name: string
                    description?: string | null
                    price_amount: number
                    price_currency?: string | null
                    duration_text?: string | null
                    duration_minutes?: number | null
                    category?: string | null
                    image_url?: string | null
                    images?: string[] | null
                    lat?: number | null
                    lng?: number | null
                    location_text?: string | null
                    deposit_amount?: number | null // Added
                }
                Update: {
                    id?: string
                    created_at?: string
                    business_id?: string | null
                    profile_id?: string | null
                    name?: string
                    description?: string | null
                    price_amount?: number
                    price_currency?: string | null
                    duration_text?: string | null
                    duration_minutes?: number | null
                    category?: string | null
                    image_url?: string | null
                    images?: string[] | null
                    lat?: number | null
                    lng?: number | null
                    location_text?: string | null
                    deposit_amount?: number | null // Added
                }
            }
            bookings: {
                Row: {
                    id: string
                    created_at: string
                    user_id: string
                    business_id: string | null
                    provider_id: string | null
                    service_id: string | null
                    booking_date: string
                    status: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled'
                    total_amount: number
                    paystack_reference: string | null
                    notes: string | null
                    amount_paid: number | null // Added
                }
                Insert: {
                    id?: string
                    created_at?: string
                    user_id: string
                    business_id?: string | null
                    provider_id?: string | null
                    service_id?: string | null
                    booking_date: string
                    status?: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled'
                    total_amount: number
                    paystack_reference?: string | null
                    notes?: string | null
                    amount_paid?: number | null // Added
                }
                Update: {
                    id?: string
                    created_at?: string
                    user_id?: string
                    business_id?: string | null
                    provider_id?: string | null
                    service_id?: string | null
                    booking_date?: string
                    status?: 'pending_payment' | 'confirmed' | 'completed' | 'cancelled'
                    total_amount?: number
                    paystack_reference?: string | null
                    notes?: string | null
                    amount_paid?: number | null // Added
                }
            }
            reviews: {
                Row: {
                    id: string
                    created_at: string
                    business_id: string | null
                    reviewed_profile_id: string | null
                    user_id: string
                    rating: number | null
                    comment: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    business_id?: string | null
                    reviewed_profile_id?: string | null
                    user_id: string
                    rating?: number | null
                    comment?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    business_id?: string | null
                    reviewed_profile_id?: string | null
                    user_id?: string
                    rating?: number | null
                    comment?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
