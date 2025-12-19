import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

/**
 * GET /api/students/:id
 * Fetch complete student details with related cohort, program, and season information
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

    // Fetch student with all related information
    const { data: student, error: studentError } = await client
      .from('students')
      .select(`
        *,
        cohorts(id, name, start_date, end_date),
        programs(id, name, description),
        current_season:seasons!students_current_season_id_fkey(id, name, order_in_program),
        expected_season:seasons!students_expected_season_id_fkey(id, name, order_in_program)
      `)
      .eq('id', studentId)
      .single()

    if (studentError) {
      console.error('Error fetching student:', studentError)
      throw createError({
        statusCode: 404,
        statusMessage: studentError.message || 'Student not found'
      })
    }

    // Fetch completed projects count
    const { count: completedProjectsCount, error: countError } = await client
      .from('student_project_completion')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('is_completed', true)

    if (countError) {
      console.error('Error counting completed projects:', countError)
    }

    // Add completed projects count to student data
    student.completed_projects = completedProjectsCount || 0

    return { data: student }
  } catch (err) {
    console.error('Student details handler error:', err)

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
