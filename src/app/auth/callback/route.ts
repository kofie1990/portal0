import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Check Profile for Onboarding Status & Role
            const { data: { user } } = await supabase.auth.getUser();
            let redirectPath = next;

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, onboarding_completed')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    if (profile.role === 'business') {
                        // Business users are already "onboarded" by the wizard, or go to dashboard
                        redirectPath = `/dashboard/${user.id}`;
                    } else if (!profile.onboarding_completed) {
                        // Regular users needing onboarding
                        redirectPath = '/onboarding';
                    } else {
                        // Default for completed users
                        redirectPath = '/account';
                    }
                }
            }

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${redirectPath}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
            } else {
                return NextResponse.redirect(`${origin}${redirectPath}`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
