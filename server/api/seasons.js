import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)

        // Fetch all seasons
        const { data: seasons, error: seasonsErr } = await client
            .from('seasons')
            .select('id, name')
            .order('name', { ascending: true })

        if (seasonsErr) {
            console.error('Error fetching seasons', seasonsErr)
            throw createError({ statusCode: 500, statusMessage: seasonsErr.message || 'Failed fetching seasons' })
        }

        return { data: seasons }
    } catch (err) {
        console.error('Seasons handler error', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Internal server error' })
    }
})
