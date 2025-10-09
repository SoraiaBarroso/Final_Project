import { ref } from 'vue'

export function useAttendance() {
    const data = ref<any | null>(null)
    const error = ref<string | null>(null)
    const loading = ref(false)
    const dataByCohort = ref<any | null>(null)

    async function fetchAttendance() {
        loading.value = true
        error.value = null
        try {
            const res = await $fetch('/api/attendance')
            if (!res) throw new Error(`Fetch failed: ${res}`)
            data.value = res?.data?.value ?? null
        } catch (err: unknown) {
            // normalize error
            error.value = err instanceof Error ? err.message : String(err)
            data.value = null
        } finally {
            loading.value = false
        }
    }

    async function fetchAttendanceByCohort() {
        loading.value = true
        error.value = null
        try {
            const res = await $fetch('/api/attendance_by_cohort')
            if (!res) throw new Error(`Fetch failed: ${res}`)
            dataByCohort.value = res?.data?.value ?? null
        } catch (err: unknown) {
            // normalize error
            error.value = err instanceof Error ? err.message : String(err)
            dataByCohort.value = null
        } finally {
            loading.value = false
        }
    }


    return { data, dataByCohort, error, loading, fetchAttendance, fetchAttendanceByCohort }
}
