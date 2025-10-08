import { ref } from 'vue'

export function useAttendance() {
    const data = ref<any | null>(null)
    const error = ref<string | null>(null)
    const loading = ref(false)

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

    return { data, error, loading, fetchAttendance }
}
