import { CACHE_KEYS } from './useCacheInvalidation'

export function useAttendance() {
  const nuxtApp = useNuxtApp()

  // Use Nuxt's useFetch with caching for overall attendance
  const {
    data: attendanceData,
    refresh: refreshAttendance,
    status: attendanceStatus,
    error: attendanceError
  } = useFetch('/api/attendance', {
    key: CACHE_KEYS.ATTENDANCE,
    getCachedData(key) {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })

  // Use Nuxt's useFetch with caching for attendance by cohort
  const {
    data: attendanceByCohortData,
    refresh: refreshAttendanceByCohort,
    status: byCohortStatus,
    error: byCohortError
  } = useFetch('/api/attendance_by_cohort', {
    key: CACHE_KEYS.ATTENDANCE_BY_COHORT,
    getCachedData(key) {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })

  // Computed properties
  const data = computed(() => attendanceData.value?.data?.value ?? null)
  const dataByCohort = computed(() => attendanceByCohortData.value?.data?.value ?? null)
  const loading = computed(() =>
    attendanceStatus.value === 'pending' || byCohortStatus.value === 'pending'
  )
  const error = computed(() =>
    attendanceError.value?.message || byCohortError.value?.message || null
  )

  /**
   * Force refresh attendance data
   */
  async function fetchAttendance() {
    await refreshAttendance()
  }

  /**
   * Force refresh attendance by cohort data
   */
  async function fetchAttendanceByCohort() {
    await refreshAttendanceByCohort()
  }

  /**
   * Refresh all attendance data
   */
  async function refreshAll() {
    await Promise.all([
      refreshAttendance(),
      refreshAttendanceByCohort()
    ])
  }

  return {
    data,
    dataByCohort,
    error,
    loading,
    fetchAttendance,
    fetchAttendanceByCohort,
    refreshAll
  }
}
