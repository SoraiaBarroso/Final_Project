import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)
    const user = await serverSupabaseUser(event)

    if (!user?.email) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const query = getQuery(event)
    const programCohortSeasonId = query.programCohortSeasonId

    if (!programCohortSeasonId) {
      return { data: [] }
    }

    // Fetch projects for this program_cohort_season
    const { data: projectSchedules, error: scheduleError } = await client
      .from('program_cohort_season_projects')
      .select(`
        id,
        start_date,
        end_date,
        projects!inner (
          id,
          name,
          description
        )
      `)
      .eq('program_cohort_season_id', programCohortSeasonId)

    if (scheduleError) {
      throw createError({ statusCode: 500, statusMessage: scheduleError.message })
    }

    return { data: projectSchedules || [] }
  } catch (err) {
    console.error('Timeline projects handler error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err?.message || 'Internal server error'
    })
  }
})
