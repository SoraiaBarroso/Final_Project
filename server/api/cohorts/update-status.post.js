import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)
        const body = await readBody(event)

        const { cohort_name, is_active } = body

        // Validate required fields
        if (!cohort_name || is_active === undefined) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required fields: cohort_name, is_active'
            })
        }

        // Update all cohorts with this name (across all programs)
        const { data: updatedCohorts, error: updateErr } = await client
            .from('cohorts')
            .update({ is_active })
            .eq('name', cohort_name)
            .select()

        if (updateErr) {
            console.error('Error updating cohort status', updateErr)
            throw createError({ statusCode: 500, statusMessage: updateErr.message || 'Failed updating cohort status' })
        }

        return {
            success: true,
            data: updatedCohorts,
            message: `Successfully ${is_active ? 'activated' : 'deactivated'} cohort "${cohort_name}" for ${updatedCohorts.length} programs`
        }
    } catch (err) {
        console.error('Update cohort status handler error', err)
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err?.message || err?.statusMessage || 'Internal server error'
        })
    }
})
