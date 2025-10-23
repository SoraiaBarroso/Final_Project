import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)
        const body = await readBody(event)

        const { name, meeting_id, is_active, programs } = body

        // Validate required fields
        if (!name) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required field: name'
            })
        }

        if (!programs || !Array.isArray(programs) || programs.length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'At least one program must be selected'
            })
        }

        // Validate each program entry has required fields
        for (const prog of programs) {
            if (!prog.program_id || !prog.start_date || !prog.end_date) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'Each program must have program_id, start_date, and end_date'
                })
            }
        }

        // Default is_active to true if not provided
        const activeStatus = is_active !== undefined ? is_active : true

        // Create a cohort entry for each selected program
        const cohortEntries = programs.map(prog => ({
            name,
            program_id: prog.program_id,
            start_date: prog.start_date,
            end_date: prog.end_date,
            meeting_id: meeting_id || null,
            is_active: activeStatus
        }))

        // Insert all cohorts
        const { data: newCohorts, error: insertErr } = await client
            .from('cohorts')
            .insert(cohortEntries)
            .select()

        if (insertErr) {
            console.error('Error creating cohorts', insertErr)
            throw createError({ statusCode: 500, statusMessage: insertErr.message || 'Failed creating cohorts' })
        }

        return {
            success: true,
            data: newCohorts,
            message: `Successfully created cohort "${name}" for ${newCohorts.length} program(s)`
        }
    } catch (err) {
        console.error('Create cohort handler error', err)
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err?.message || err?.statusMessage || 'Internal server error'
        })
    }
})
