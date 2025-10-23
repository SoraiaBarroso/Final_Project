import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)

        // Fetch all cohorts with their associated programs
        const { data: cohorts, error: cohortsErr } = await client
            .from('cohorts')
            .select(`
                id,
                name,
                program_id,
                start_date,
                end_date,
                meeting_id,
                created_at,
                is_active,
                programs (
                    id,
                    name
                )
            `)
            .order('name', { ascending: false })

        if (cohortsErr) {
            console.error('Error fetching cohorts', cohortsErr)
            throw createError({ statusCode: 500, statusMessage: cohortsErr.message || 'Failed fetching cohorts' })
        }

        // Group cohorts by name and aggregate program information
        const cohortMap = new Map()

        for (const cohort of cohorts) {
            const cohortName = cohort.name

            if (!cohortMap.has(cohortName)) {
                cohortMap.set(cohortName, {
                    name: cohortName,
                    start_date: cohort.start_date,
                    end_date: cohort.end_date,
                    meeting_id: cohort.meeting_id,
                    created_at: cohort.created_at,
                    is_active: cohort.is_active,
                    cohort_ids: [],
                    programs: [],
                    program_count: 0
                })
            }

            const entry = cohortMap.get(cohortName)
            entry.cohort_ids.push(cohort.id)

            if (cohort.programs) {
                entry.programs.push({
                    id: cohort.programs.id,
                    name: cohort.programs.name,
                    cohort_id: cohort.id,
                    meeting_id: cohort.meeting_id
                })
                entry.program_count++
            }
        }

        // Convert map to array
        const result = Array.from(cohortMap.values()).map((item, idx) => ({
            idx,
            ...item
        }))

        return { data: result }
    } catch (err) {
        console.error('Cohorts handler error', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Internal server error' })
    }
})
