import { useState } from "nuxt/app"
import type { User } from "@supabase/supabase-js"

export const useAuth = () => {
    // Use useState to create a global reactive user state (like in the tutorial)
    const user = useState<User | null>('user', () => null)
    // Add role state to track user's role from profiles table
    const role = useState<string>('role', () => 'guest')

    // Get the Supabase client from @nuxtjs/supabase module
    const supabase = useSupabaseClient()    // Also get the built-in user state for comparison/fallback
    const supabaseUser = useSupabaseUser()

    const getUser = async () => {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
            console.error('Error fetching user:', error)
            user.value = null
            role.value = 'guest'
            return null
        }

        if (data.user) {
            user.value = data.user

            // Fetch role from profiles table
            const { data: profile, error: profileError } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", data.user.id)
                .single() as { data: { role: string } | null, error: any }

            if (profileError) {
                console.error('Error fetching user profile:', profileError)
                role.value = 'user' // Default to 'user' if profile fetch fails
            } else if (profile && profile.role) {
                role.value = profile.role
            } else {
                console.log("No profile found, defaulting to 'user' role")
                role.value = 'user'
            }
        } else {
            console.log("No user found")
            user.value = null
            role.value = 'guest'
        }

        return data.user
    }

    const signInWithGoogle = async () => {
        console.log("Starting Google OAuth sign in...")

        // Get the current origin to make redirect URL dynamic
        const redirectUrl = `${window.location.origin}/auth/confirm`
        console.log("OAuth redirect URL:", redirectUrl)

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                scopes: "https://www.googleapis.com/auth/calendar.readonly",
                redirectTo: redirectUrl,
                queryParams: { access_type: "offline", prompt: "consent" },
            },
        })

        if (error) {
            console.error("OAuth error:", error)
            return { data: null, error }
        }

        console.log("OAuth initiated successfully, redirecting to Google...")
        return { data, error: null }
    }

    const signOut = async () => {
        console.log("Signing out...")
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error('Error signing out:', error)
        } else {
            user.value = null
            role.value = 'guest'
            console.log("User signed out successfully")
        }

        return { error }
    }

    // Initialize user state when composable is first used
    onMounted(async () => {
        await getUser()
        console.log("Initial user state set:", user || 'null')
    })

    // Watch for changes in the supabase user state and sync with our local state
    watch(supabaseUser, (newUser) => {
        user.value = newUser
        if (!newUser) {
            role.value = 'guest'
        }
    }, { immediate: true })

    // Helper functions for role checking
    const isAdmin = () => role.value === 'admin'
    const isUser = () => role.value === 'user'
    const isAuthenticated = () => !!user.value

    return {
        user, // Global reactive user state
        role, // User role from profiles table ('user', 'admin', or 'guest')
        getUser,
        signInWithGoogle,
        signOut,
        // Helper functions
        isAdmin,
        isUser,
        isAuthenticated
    }
}