import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)

        // Fetch all programs
        const { data: programs, error: programsErr } = await client
            .from('programs')
            .select('id, name, description')
            .order('name', { ascending: true })

        console.log('Fetched programs:', programs)
        if (programsErr) {
            console.error('Error fetching programs', programsErr)
            throw createError({ statusCode: 500, statusMessage: programsErr.message || 'Failed fetching programs' })
        }

        return { data: programs }
    } catch (err) {
        console.error('Programs handler error', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Internal server error' })
    }
})
