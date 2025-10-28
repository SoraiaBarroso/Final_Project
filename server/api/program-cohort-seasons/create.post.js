import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)
        const body = await readBody(event)

        // Validate required fields
        if (!body.season_id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required field: season_id'
            })
        }

        if (!body.cohort_id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required field: cohort_id'
            })
        }

        if (!body.program_id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required field: program_id'
            })
        }

        if (!body.start_date) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required field: start_date'
            })
        }

        if (!body.end_date) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Missing required field: end_date'
            })
        }

        // Validate that end_date is after start_date
        if (new Date(body.end_date) <= new Date(body.start_date)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'End date must be after start date'
            })
        }

        // Check if this combination already exists
        const { data: existing, error: existingErr } = await client
            .from('program_cohort_seasons')
            .select('id')
            .eq('season_id', body.season_id)
            .eq('cohort_id', body.cohort_id)
            .eq('program_id', body.program_id)
            .single()

        if (existing) {
            throw createError({
                statusCode: 400,
                statusMessage: 'This season already exists for the selected program and cohort'
            })
        }

        // Insert the new program_cohort_season entry
        const { data, error } = await client
            .from('program_cohort_seasons')
            .insert({
                season_id: body.season_id,
                cohort_id: body.cohort_id,
                program_id: body.program_id,
                start_date: body.start_date,
                end_date: body.end_date
            })
            .select()

        if (error) {
            console.error('Error creating program cohort season:', error)
            throw createError({
                statusCode: 500,
                statusMessage: error.message || 'Failed to create program cohort season'
            })
        }

        return {
            success: true,
            message: 'Program cohort season created successfully',
            data
        }
    } catch (err) {
        console.error('Create program cohort season handler error:', err)
        throw createError({
            statusCode: err.statusCode || 500,
            statusMessage: err?.message || 'Internal server error'
        })
    }
})
