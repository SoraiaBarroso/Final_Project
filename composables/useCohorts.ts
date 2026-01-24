import { CACHE_KEYS } from './useCacheInvalidation'
import type { Cohort, Program } from '~/types'

export function useCohorts() {
  const nuxtApp = useNuxtApp()

  // Use Nuxt's useFetch with caching
  const { data: cohortsData, refresh, status, error: fetchError } = useFetch('/api/cohorts', {
    key: CACHE_KEYS.COHORTS,
    getCachedData(key) {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })

  // Local filtered state (for when filters are applied)
  const filteredCohorts = ref<Cohort[]>([])
  const hasActiveFilter = ref(false)

  // Computed properties
  const cohorts = computed(() => {
    if (hasActiveFilter.value) {
      return filteredCohorts.value
    }
    return cohortsData.value?.data || []
  })
  const loading = computed(() => status.value === 'pending')
  const error = computed(() => fetchError.value?.message || null)

  /**
   * Fetch cohorts with optional filtering
   * Filters are applied client-side to preserve caching benefits
   */
  async function fetchCohorts(filters?: { program_id?: string }) {
    // Ensure data is loaded
    if (!cohortsData.value) {
      await refresh()
    }

    const allCohorts = cohortsData.value?.data || []

    // Apply filters if provided
    if (filters?.program_id) {
      hasActiveFilter.value = true
      filteredCohorts.value = allCohorts.filter((cohort: Cohort) => {
        return cohort.programs?.some((program: Program) => program.id === filters.program_id)
      })
    } else {
      hasActiveFilter.value = false
      filteredCohorts.value = []
    }
  }

  /**
   * Create a new cohort
   */
  async function createCohort(cohortData: {
    name: string;
    meeting_id?: string;
    is_active?: boolean;
    programs: Array<{ program_id: string; start_date: string; end_date: string }>
  }) {
    try {
      const response = await $fetch('/api/cohorts/create', {
        method: 'POST',
        body: cohortData
      })

      // Invalidate cache and refresh
      await refreshNuxtData(CACHE_KEYS.COHORTS)

      return response
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
      const errorMessage = fetchErr?.data?.statusMessage || fetchErr?.message || 'Failed to create cohort'
      throw new Error(errorMessage)
    }
  }

  /**
   * Toggle cohort active status
   */
  async function toggleCohortStatus(cohortName: string, isActive: boolean) {
    try {
      const response = await $fetch('/api/cohorts/update-status', {
        method: 'POST',
        body: {
          cohort_name: cohortName,
          is_active: isActive
        }
      })

      // Invalidate cache and refresh
      await refreshNuxtData(CACHE_KEYS.COHORTS)

      return response
    } catch (err: unknown) {
      const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
      const errorMessage = fetchErr?.data?.statusMessage || fetchErr?.message || 'Failed to update cohort status'
      throw new Error(errorMessage)
    }
  }

  return {
    cohorts,
    loading,
    error,
    fetchCohorts,
    refresh,
    createCohort,
    toggleCohortStatus
  }
}
