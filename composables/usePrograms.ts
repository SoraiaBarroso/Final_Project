import { CACHE_KEYS } from './useCacheInvalidation'

export function usePrograms() {
  const nuxtApp = useNuxtApp()

  // Use Nuxt's useFetch with caching
  const { data: programsData, refresh, status, error: fetchError } = useFetch('/api/programs', {
    key: CACHE_KEYS.PROGRAMS,
    getCachedData(key) {
      // Return cached data if available (prevents refetch on navigation)
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })

  // Computed properties for easy access
  const programs = computed(() => programsData.value?.data || [])
  const loading = computed(() => status.value === 'pending')
  const error = computed(() => fetchError.value?.message || null)

  /**
   * Computed property to get programs as dropdown options
   */
  const programOptions = computed(() =>
    programs.value.map((p: any) => ({
      label: p.name,
      value: p.id
    }))
  )

  /**
   * Force refresh programs data (clears cache and refetches)
   */
  async function fetchPrograms() {
    await refresh()
    return { data: programs.value }
  }

  /**
   * Get a single program by ID
   */
  function getProgramById(id: string) {
    return programs.value.find((p: any) => p.id === id)
  }

  /**
   * Get a single program by name
   */
  function getProgramByName(name: string) {
    return programs.value.find((p: any) => p.name === name)
  }

  return {
    programs,
    programOptions,
    loading,
    error,
    fetchPrograms,
    refresh,
    getProgramById,
    getProgramByName
  }
}
