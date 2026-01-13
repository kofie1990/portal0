
import { createClient } from '@/lib/supabase/server';
import { MOCK_BUSINESSES } from '@/lib/mock-data';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // 1. Check verification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized. Please log in to seed data.' }, { status: 401 });
    }

    const results = [];

    try {
        for (const biz of MOCK_BUSINESSES) {
            // 2. Map Business Data
            const locationType = biz.type === 'individual' ? 'mobile' : 'physical';

            const { data: businessData, error: businessError } = await supabase.from('businesses').insert({
                owner_id: user.id, // Assign all to current user
                name: biz.name,
                category: biz.category,
                bio: biz.bio || null,
                description: biz.items ? `Specializes in: ${biz.items.join(', ')}` : null,
                location_address: biz.address || biz.location,
                lat: biz.lat,
                lng: biz.lng,
                location_type: locationType,
                phone: biz.phone,
                email: biz.email,
                image_url: biz.imageUrl || null, // Map imageUrl
                cover_image_url: biz.coverImage || null,
                deposit_fee: biz.depositFee || 0,
                open_now: biz.openNow || false,
                rating: biz.rating,
                review_count: biz.reviews
            }).select().single();

            if (businessError) {
                console.error(`Failed to insert ${biz.name}:`, businessError);
                results.push({ name: biz.name, status: 'failed', error: businessError.message });
                continue;
            }

            // 3. Map Services
            // Prioritize 'services' array. If missing, we skip products as per "Service-Only" rule.
            if (biz.services && biz.services.length > 0) {
                const servicesToInsert = biz.services.map(svc => {
                    // Parse price: "GH₵ 150" -> 150.00
                    const priceString = svc.price.replace(/[^0-9.]/g, '');
                    const priceAmount = parseFloat(priceString) || 0;

                    return {
                        business_id: businessData.id,
                        name: svc.name,
                        description: null,
                        price_amount: priceAmount,
                        duration_text: svc.duration,
                        // duration_minutes: parseDuration(svc.duration) // Optional enhancement
                    };
                });

                const { error: servicesError } = await supabase.from('services').insert(servicesToInsert);

                if (servicesError) {
                    console.error(`Failed to insert services for ${biz.name}:`, servicesError);
                }
            }

            results.push({ name: biz.name, status: 'success', id: businessData.id });
        }

        return NextResponse.json({ message: 'Seeding completed', results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
