// Get historical snapshot data for mini charts
import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)

    // Get last 12 snapshots (roughly 3 months if weekly)
    const { data, error } = await client
      .from('progress_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(12)

    if (error) {
      console.error('Supabase query error', error)
      throw createError({ statusCode: 500, statusMessage: error.message || 'Supabase query failed' })
    }

    if (!data || data.length === 0) {
      return {
        data: {
          value: {
            message: 'No data',
            total: [],
            on_track: [],
            at_risk: [],
            monitor: [],
          },
        },
      }
    }

    // Reverse to get chronological order (oldest to newest)
    const snapshots = data.reverse()

    // Format data for charts
    const result = {
      total: snapshots.map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: s.total_students
      })),
      on_track: snapshots.map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: s.on_track
      })),
      at_risk: snapshots.map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: s.at_risk
      })),
      monitor: snapshots.map(s => ({
        date: new Date(s.snapshot_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: s.monitor
      })),
    }

    return { data: { value: result } }
  } catch (err) {
    console.error('Snapshot history handler error', err)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Internal server error' })
  }
})
