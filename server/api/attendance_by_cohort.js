import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)

        // Fetch active students with cohort ids and attendance counters
        const { data: students = [], error: studentsErr } = await client
            .from('students')
            .select('id,username,cohort_id,workshops_attended,standup_attended,mentoring_attended')
            .eq('is_active', true)

        if (studentsErr) {
            console.error('Error fetching students', studentsErr)
            throw createError({ statusCode: 500, statusMessage: studentsErr.message || 'Failed fetching students' })
        }

        // Fetch cohort meeting stats (prefered source for workshop totals)
        const { data: workshopStats = [] } = await client
            .from('cohort_meeting_stats')
            .select('cohort_id,total_meetings,meeting_type')

        // Fetch cohort meetings (weeks per cohort per meeting type)
        const { data: cohortMeetings = [] } = await client
            .from('cohort_meetings')
            .select('cohort_id,weeks,meeting_type')

        // Fetch meeting types (frequency per week)
        const { data: meetingTypes = [] } = await client
            .from('meeting_types')
            .select('name,frequency_per_week')

        // Fetch cohort names (if available) so we can include cohort_name in the output
        const { data: cohortsTable = [] } = await client
            .from('cohorts')
            .select('id,name')

        // Build helper maps
        const meetingTypeMap = new Map()
        for (const mt of meetingTypes) meetingTypeMap.set(mt.name, Number(mt.frequency_per_week || 0))

        // Map cohort_meeting_stats by cohort + meeting_type so we can prefer recorded totals for any meeting type
        const cohortMeetingStatsMap = new Map()
        for (const w of workshopStats) {
            const key = `${w.cohort_id}:${w.meeting_type}`
            cohortMeetingStatsMap.set(key, Number(w.total_meetings || 0))
        }

        // Build map of cohort id -> name for nicer output
        const cohortNameMap = new Map()
        for (const c of cohortsTable) {
            cohortNameMap.set(c.id, c.name)
        }

        const cohortWeeksMap = new Map()
        for (const m of cohortMeetings) {
            cohortWeeksMap.set(`${m.cohort_id}:${m.meeting_type}`, Number(m.weeks || 0))
        }

        // Group students by cohort
        const cohorts = new Map()
        for (const s of students) {
            const cid = s.cohort_id || 'unknown'
            if (!cohorts.has(cid)) cohorts.set(cid, { students: [], totals: { workshops: 0, standups: 0, mentoring: 0 } })
            const entry = cohorts.get(cid)
            entry.students.push(s)
            entry.totals.workshops += Number(s.workshops_attended || 0)
            entry.totals.standups += Number(s.standup_attended || 0)
            entry.totals.mentoring += Number(s.mentoring_attended || 0)
        }

        function avg(values) {
            const nums = values.filter((v) => v != null && !Number.isNaN(v)).map(Number)
            if (nums.length === 0) return null
            const sum = nums.reduce((a, b) => a + b, 0)
            return Math.round((sum / nums.length) * 100) / 100
        }

        // Build result per cohort
        const result = []
        for (const [cohortId, info] of cohorts.entries()) {
            const studentsList = info.students

            // Expected recordings per type for this cohort
            const expected_workshops = cohortMeetingStatsMap.get(`${cohortId}:workshop`) ?? ((cohortWeeksMap.get(`${cohortId}:workshop`) ?? 0) * (meetingTypeMap.get('workshop') ?? 0))
            const expected_standups = cohortMeetingStatsMap.get(`${cohortId}:standup`) ?? ((cohortWeeksMap.get(`${cohortId}:standup`) ?? 0) * (meetingTypeMap.get('standup') ?? 0))
            const expected_mentoring = cohortMeetingStatsMap.get(`${cohortId}:mentoring`) ?? ((cohortWeeksMap.get(`${cohortId}:mentoring`) ?? 0) * (meetingTypeMap.get('mentoring') ?? 0))

            // Aggregate per-student rates
            const attendanceRates = []
            for (const s of studentsList) {
                const workshop_rate = expected_workshops > 0 ? (Number(s.workshops_attended || 0) / expected_workshops) * 100 : null
                const standup_rate = expected_standups > 0 ? (Number(s.standup_attended || 0) / expected_standups) * 100 : null
                const mentoring_rate = expected_mentoring > 0 ? (Number(s.mentoring_attended || 0) / expected_mentoring) * 100 : null

                const total_expected = expected_workshops + expected_standups + expected_mentoring
                const overall_rate = total_expected > 0 ? ((Number(s.workshops_attended || 0) + Number(s.standup_attended || 0) + Number(s.mentoring_attended || 0)) / total_expected) * 100 : null

                attendanceRates.push({ workshop_rate, standup_rate, mentoring_rate, overall_rate })
            }

            const cohortOverallAvg = avg(attendanceRates.map((r) => r.overall_rate))
            const cohortWorkshopAvg = avg(attendanceRates.map((r) => r.workshop_rate))
            const cohortStandupAvg = avg(attendanceRates.map((r) => r.standup_rate))
            const cohortMentoringAvg = avg(attendanceRates.map((r) => r.mentoring_rate))

            const sumWorkshopAttended = info.totals.workshops
            const sumStandupAttended = info.totals.standups
            const sumMentoringAttended = info.totals.mentoring

            const cohortWorkshopRecordings = expected_workshops
            const cohortStandupRecordings = expected_standups
            const cohortMentoringRecordings = expected_mentoring

            const workshop_attended_vs_recorded_pct = cohortWorkshopRecordings > 0 ? Math.round((sumWorkshopAttended / cohortWorkshopRecordings) * 10000) / 100 : null
            const standup_attended_vs_recorded_pct = cohortStandupRecordings > 0 ? Math.round((sumStandupAttended / cohortStandupRecordings) * 10000) / 100 : null
            const mentoring_attended_vs_recorded_pct = cohortMentoringRecordings > 0 ? Math.round((sumMentoringAttended / cohortMentoringRecordings) * 10000) / 100 : null

            result.push({
                cohort_id: cohortId,
                cohort_name: cohortNameMap.get(cohortId) ?? null,
                students_count: studentsList.length,
                averages: {
                    overall: cohortOverallAvg,
                    workshop: cohortWorkshopAvg,
                    standup: cohortStandupAvg,
                    mentoring: cohortMentoringAvg,
                },
                recordings: {
                    workshop: cohortWorkshopRecordings,
                    standup: cohortStandupRecordings,
                    mentoring: cohortMentoringRecordings,
                },
                attended: {
                    workshop: sumWorkshopAttended,
                    standup: sumStandupAttended,
                    mentoring: sumMentoringAttended,
                },
                attended_vs_recorded_pct: {
                    workshop: workshop_attended_vs_recorded_pct,
                    standup: standup_attended_vs_recorded_pct,
                    mentoring: mentoring_attended_vs_recorded_pct,
                }
            })
        }

        // Group results by cohort_name (some cohort names like 'Sep 22' appear across multiple cohort ids/programs)
        const grouped = new Map()
        for (const item of result) {
            const name = item.cohort_name ?? item.cohort_id ?? 'unknown'
            if (!grouped.has(name)) {
                grouped.set(name, {
                    cohort_name: name,
                    cohort_ids: new Set(),
                    students_count: 0,
                    attended: { workshop: 0, standup: 0, mentoring: 0 },
                    recordings: { workshop: 0, standup: 0, mentoring: 0 },
                    // weighted sums for averages
                    _weights: { overall: 0, workshop: 0, standup: 0, mentoring: 0 },
                    _numerators: { overall: 0, workshop: 0, standup: 0, mentoring: 0 },
                })
            }

            const g = grouped.get(name)
            g.cohort_ids.add(item.cohort_id)
            g.students_count += item.students_count || 0
            g.attended.workshop += item.attended?.workshop || 0
            g.attended.standup += item.attended?.standup || 0
            g.attended.mentoring += item.attended?.mentoring || 0
            g.recordings.workshop += item.recordings?.workshop || 0
            g.recordings.standup += item.recordings?.standup || 0
            g.recordings.mentoring += item.recordings?.mentoring || 0

            // accumulate weighted numerators for averages (skip null averages)
            const sc = item.students_count || 0
            if (item.averages?.overall != null) {
                g._numerators.overall += item.averages.overall * sc
                g._weights.overall += sc
            }
            if (item.averages?.workshop != null) {
                g._numerators.workshop += item.averages.workshop * sc
                g._weights.workshop += sc
            }
            if (item.averages?.standup != null) {
                g._numerators.standup += item.averages.standup * sc
                g._weights.standup += sc
            }
            if (item.averages?.mentoring != null) {
                g._numerators.mentoring += item.averages.mentoring * sc
                g._weights.mentoring += sc
            }
        }

        // Build final grouped array
        const finalResult = []
        for (const [name, g] of grouped.entries()) {
            const students_count = g.students_count

            function safeAvg(num, weight) {
                if (!weight || weight === 0) return null
                return Math.round((num / weight) * 100) / 100
            }

            const averages = {
                overall: safeAvg(g._numerators.overall, g._weights.overall),
                workshop: safeAvg(g._numerators.workshop, g._weights.workshop),
                standup: safeAvg(g._numerators.standup, g._weights.standup),
                mentoring: safeAvg(g._numerators.mentoring, g._weights.mentoring),
            }

            const attended_vs_recorded_pct = {
                workshop: g.recordings.workshop > 0 ? Math.round((g.attended.workshop / g.recordings.workshop) * 10000) / 100 : null,
                standup: g.recordings.standup > 0 ? Math.round((g.attended.standup / g.recordings.standup) * 10000) / 100 : null,
                mentoring: g.recordings.mentoring > 0 ? Math.round((g.attended.mentoring / g.recordings.mentoring) * 10000) / 100 : null,
            }

            finalResult.push({
                cohort_name: name,
                cohort_ids: Array.from(g.cohort_ids),
                students_count,
                averages,
                recordings: g.recordings,
                attended: g.attended,
                attended_vs_recorded_pct,
            })
        }

        return { data: { value: finalResult } }
    } catch (err) {
        console.error('Attendance by cohort handler error', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Internal server error' })
    }
})
