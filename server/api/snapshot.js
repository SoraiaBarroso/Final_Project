// final_project/api/snapshot.js
import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  try {
    const client = await serverSupabaseClient(event)

    // Get the two most recent snapshots
    const { data, error } = await client
      .from('progress_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(2)

    console.log('data:', data, 'error:', error)
    if (error) {
      console.error('Supabase query error', error)
      throw createError({ statusCode: 500, statusMessage: error.message || 'Supabase query failed' })
    }

    if (!data || data.length < 2) {
      // Keep return shape simple and compatible with frontend which expects { data: { value } }
      return {
        data: {
          value: {
            message: 'Not enough data',
            total_pct_change: null,
            on_track_pct_change: null,
            at_risk_pct_change: null,
            monitor_pct_change: null,
          },
        },
      }
    }

    const [latest, previous] = data
    const latestDate = new Date(latest.snapshot_date)

    function pctChange(curr, prev) {
      if (!prev || prev === 0) return curr > 0 ? 100 : 0
      return (100 * (curr - prev)) / prev
    }

    const result = {
      snapshot_date: latest.snapshot_date,
      comparison_date: previous.snapshot_date,
      days_compared: Math.round((latestDate - new Date(previous.snapshot_date)) / (1000 * 60 * 60 * 24)),
      total_change: latest.total_students - previous.total_students,
      total_pct_change: pctChange(latest.total_students, previous.total_students),
      on_track_change: latest.on_track - previous.on_track,
      on_track_pct_change: pctChange(latest.on_track, previous.on_track),
      at_risk_change: latest.at_risk - previous.at_risk,
      at_risk_pct_change: pctChange(latest.at_risk, previous.at_risk),
      monitor_change: latest.monitor - previous.monitor,
      monitor_pct_change: pctChange(latest.monitor, previous.monitor),
    }

    return { data: { value: result } }
  } catch (err) {
    console.error('Snapshot handler error', err)
    throw createError({ statusCode: 500, statusMessage: err?.message || 'Internal server error' })
  }
})
