import { createError } from 'h3'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)
        const user = await serverSupabaseUser(event)

        // Check if user is authenticated
        if (!user) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Not authenticated'
            })
        }

        console.log('Ensuring profile for user:', user.email)

        // Check if user email exists in admin table
        const { data: adminRecord, error: adminError } = await client
            .from('admin')
            .select('email, role')
            .eq('email', user.email)
            .single()

        // Determine role based on admin table
        const role = adminRecord && !adminError ? 'admin' : 'user'

        console.log('Role determined:', role, 'Admin record:', adminRecord)

        // Check if profile already exists
        const { data: existingProfile, error: profileCheckError } = await client
            .from('profiles')
            .select('id, role')
            .eq('id', user.id)
            .single()

        if (profileCheckError && profileCheckError.code !== 'PGRST116') {
            // PGRST116 is "not found" error, which is expected for new users
            console.error('Error checking profile:', profileCheckError)
            throw createError({
                statusCode: 500,
                statusMessage: 'Failed to check profile'
            })
        }

        if (existingProfile) {
            // Profile exists - update role if it has changed
            if (existingProfile.role !== role) {
                console.log('Updating existing profile role from', existingProfile.role, 'to', role)

                const { error: updateError } = await client
                    .from('profiles')
                    .update({ role })
                    .eq('id', user.id)

                if (updateError) {
                    console.error('Error updating profile:', updateError)
                    throw createError({
                        statusCode: 500,
                        statusMessage: 'Failed to update profile role'
                    })
                }
            } else {
                console.log('Profile exists with correct role:', role)
            }
        } else {
            // Create new profile
            console.log('Creating new profile with role:', role)

            const { error: insertError } = await client
                .from('profiles')
                .insert({
                    id: user.id,
                    role: role,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || user.email
                })

            if (insertError) {
                console.error('Error creating profile:', insertError)
                throw createError({
                    statusCode: 500,
                    statusMessage: 'Failed to create profile'
                })
            }

            console.log('Profile created successfully')
        }

        return {
            success: true,
            role: role
        }

    } catch (err) {
        console.error('Ensure profile handler error:', err)

        // If it's already a createError, rethrow it
        if (err.statusCode) {
            throw err
        }

        // Otherwise wrap it
        return {
            success: false,
            error: err?.message || 'Internal server error'
        }
    }
})
