import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const client = await serverSupabaseClient(event)

        // Fetch all students and their attendance counters (including inactive students)
        const { data: students, error: studentsErr } = await client
            .from('students')
            .select('id,username,cohort_id,workshops_attended,standup_attended,mentoring_attended')

        const sumWorkshopAttended = students.reduce((sum, s) => sum + (s.workshops_attended || 0), 0)
        const sumStandupAttended = students.reduce((sum, s) => sum + (s.standup_attended || 0), 0)
        const sumMentoringAttended = students.reduce((sum, s) => sum + (s.mentoring_attended || 0), 0)

        if (studentsErr) {
            console.error('Error fetching students', studentsErr)
            throw createError({ statusCode: 500, statusMessage: studentsErr.message || 'Failed fetching students' })
        }

        // Fetch cohort meeting stats for workshops
        const { data: workshopStats = [] } = await client
            .from('cohort_meeting_stats')
            .select('cohort_id,total_meetings,meeting_type')

        const sumWorkshopRecordings = workshopStats.reduce((sum, workshop) => sum + (workshop.total_meetings || 0), 0)

        // Fetch cohort meetings (weeks) table
        const { data: cohortMeetings = [] } = await client
            .from('cohort_meetings')
            .select('cohort_id,weeks,meeting_type')

        // Fetch meeting types (frequency_per_week)
        const { data: meetingTypes = [] } = await client
            .from('meeting_types')
            .select('name,frequency_per_week')

        const sumMentoringRecordings = cohortMeetings
            .filter((m) => m.meeting_type === 'mentoring')
            .reduce((sum, m) => sum + (m.weeks || 0), 0) * (meetingTypes.find((mt) => mt.name === 'mentoring')?.frequency_per_week || 0)

        const sumStandupRecordings = cohortMeetings
            .filter((m) => m.meeting_type === 'standup')
            .reduce((sum, m) => sum + (m.weeks || 0), 0) * (meetingTypes.find((mt) => mt.name === 'standup')?.frequency_per_week || 0)

        console.log('Sum of workshop attended:', sumWorkshopAttended)
        console.log('Sum of workshop recordings:', sumWorkshopRecordings)
        console.log('Sum of standup attended:', sumStandupAttended)
        console.log('Sum of standup recordings:', sumStandupRecordings)
        console.log('Sum of mentoring attended:', sumMentoringAttended)
        console.log('Sum of mentoring recordings:', sumMentoringRecordings)
        // build maps for quick lookup
        const workshopMap = new Map()
        for (const r of workshopStats) {
            if (r.meeting_type === 'workshop') workshopMap.set(r.cohort_id, Number(r.total_meetings || 0))
        }

        const cohortWeeksMap = new Map()
        for (const r of cohortMeetings) {
            cohortWeeksMap.set(`${r.cohort_id}:${r.meeting_type}`, Number(r.weeks || 0))
        }

        const meetingTypeMap = new Map()
        for (const r of meetingTypes) {
            meetingTypeMap.set(r.name, Number(r.frequency_per_week || 0))
        }

        // compute attendance rates per student in JS
        const attendanceRates = []
        for (const s of students) {
            const expected_workshops = workshopMap.get(s.cohort_id) ?? 0
            const expected_standups = (cohortWeeksMap.get(`${s.cohort_id}:standup`) ?? 0) * (meetingTypeMap.get('standup') ?? 0)
            const expected_mentoring = (cohortWeeksMap.get(`${s.cohort_id}:mentoring`) ?? 0) * (meetingTypeMap.get('mentoring') ?? 0)

            const workshop_rate = expected_workshops > 0 ? (Number(s.workshops_attended || 0) / expected_workshops) * 100 : null
            const standup_rate = expected_standups > 0 ? (Number(s.standup_attended || 0) / expected_standups) * 100 : null
            const mentoring_rate = expected_mentoring > 0 ? (Number(s.mentoring_attended || 0) / expected_mentoring) * 100 : null

            const total_expected = expected_workshops + expected_standups + expected_mentoring
            const overall_rate = total_expected > 0 ? ((Number(s.workshops_attended || 0) + Number(s.standup_attended || 0) + Number(s.mentoring_attended || 0)) / total_expected) * 100 : null

            attendanceRates.push({ student_id: s.id, username: s.username, workshop_rate, standup_rate, mentoring_rate, overall_rate })
        }

        function avg(values) {
            const nums = values.filter((v) => v != null && !Number.isNaN(v)).map(Number)
            if (nums.length === 0) return null
            const sum = nums.reduce((a, b) => a + b, 0)
            return Math.round((sum / nums.length) * 100) / 100
        }

        const overallAvg = avg(attendanceRates.map((r) => r.overall_rate))
        const workshopAvg = avg(attendanceRates.map((r) => r.workshop_rate))
        const standupAvg = avg(attendanceRates.map((r) => r.standup_rate))
        const mentoringAvg = avg(attendanceRates.map((r) => r.mentoring_rate))

        const result = [
            { metric: 'overall', percentage: overallAvg },
            { metric: 'workshop', percentage: workshopAvg },
            { metric: 'standup', percentage: standupAvg },
            { metric: 'mentoring', percentage: mentoringAvg },
            { metric: 'workshop_recordings', percentage: sumWorkshopRecordings },
            { metric: 'standup_recordings', percentage: sumStandupRecordings },
            { metric: 'mentoring_recordings', percentage: sumMentoringRecordings },
            { metric: 'workshop_attended', percentage: sumWorkshopAttended },
            { metric: 'standup_attended', percentage: sumStandupAttended },
            { metric: 'mentoring_attended', percentage: sumMentoringAttended },
            { metric: 'student_count', percentage: students.length },
        ]

        return { data: { value: result } }
    } catch (err) {
        console.error('Attendance handler error', err)
        throw createError({ statusCode: 500, statusMessage: err?.message || 'Internal server error' })
    }
})
