import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/students/:id/project-completions
 * Fetch all project completions for a specific student
 */
export default defineEventHandler(async (event) => {
  try {
    const studentId = getRouterParam(event, 'id')

    if (!studentId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Student ID is required'
      })
    }

    const client = await serverSupabaseClient(event)

    // Fetch project completions with project details
    const { data: projectCompletions, error: completionsError } = await client
      .from('student_project_completion')
      .select(`
        *,
        projects(id, name, description, duration_days)
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })

    if (completionsError) {
      console.error('Error fetching project completions:', completionsError)
      throw createError({
        statusCode: 500,
        statusMessage: completionsError.message || 'Failed to fetch project completions'
      })
    }

    return { data: projectCompletions || [] }
  } catch (err) {
    console.error('Project completions handler error:', err)

    // If it's already a createError, re-throw it
    if (err.statusCode) {
      throw err
    }

    throw createError({
      statusCode: 500,
      statusMessage: err?.message || 'Internal server error'
    })
  }
})
