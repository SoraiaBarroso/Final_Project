import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const user = await serverSupabaseUser(event)

    if (!user) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }

    const query = getQuery(event)
    const period = query.period || 'today'
    const month = query.month !== undefined ? parseInt(query.month) : null
    const year = query.year !== undefined ? parseInt(query.year) : null

    // Get the access token from the request headers (passed from client)
    const accessToken = getHeader(event, 'x-google-token')

    if (!accessToken) {
      return { data: [], error: 'No Google access token provided' }
    }

    // Calculate time range based on period (with optional month/year for calendar view)
    const { timeMin, timeMax } = getTimeRange(period, month, year)

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Google Calendar API error:', errorText)
      return { data: [], error: 'Failed to fetch calendar events' }
    }

    const data = await res.json()
    return { data: data.items || [] }
  } catch (err) {
    console.error('Calendar events handler error:', err)
    throw createError({
      statusCode: err.statusCode || 500,
      statusMessage: err?.message || 'Internal server error'
    })
  }
})

function getTimeRange(period = 'today', month = null, year = null) {
  let timeMin = new Date()
  let timeMax = new Date()

  if (period === 'week') {
    timeMin.setDate(timeMin.getDate() - timeMin.getDay() + 1)
    timeMin.setHours(0, 0, 0, 0)
    timeMax.setDate(timeMax.getDate() - timeMax.getDay() + 8)
    timeMax.setHours(0, 0, 0, 0)
  } else if (period === 'month') {
    // If month and year are provided, use them (for calendar page navigation)
    if (month !== null && year !== null) {
      timeMin = new Date(year, month, 1)
      timeMin.setHours(0, 0, 0, 0)
      timeMax = new Date(year, month + 1, 0, 23, 59, 59)
    } else {
      // Default to current month
      timeMin.setDate(1)
      timeMin.setHours(0, 0, 0, 0)
      timeMax.setMonth(timeMax.getMonth() + 1, 0)
      timeMax.setHours(23, 59, 59, 999)
    }
  } else if (period === 'today') {
    timeMin.setHours(0, 0, 0, 0)
    timeMax.setHours(23, 59, 59, 999)
  }

  return {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  }
}
