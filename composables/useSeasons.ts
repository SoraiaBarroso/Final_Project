import { CACHE_KEYS } from './useCacheInvalidation'

export function useSeasons() {
  const supabase = useSupabaseClient()
  const nuxtApp = useNuxtApp()

  // Use Nuxt's useFetch with caching for the main seasons list
  const { data: seasonsData, refresh, status, error: fetchError } = useFetch('/api/seasons', {
    key: CACHE_KEYS.SEASONS,
    getCachedData(key) {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })

  // Local state for filtered seasons (by program)
  const filteredSeasons = ref<any[]>([])
  const hasActiveFilter = ref(false)

  // Computed properties
  const seasons = computed(() => {
    if (hasActiveFilter.value) {
      return filteredSeasons.value
    }
    return seasonsData.value?.data || []
  })
  const loading = computed(() => status.value === 'pending')
  const error = computed(() => fetchError.value?.message || null)

  /**
   * Computed property to get seasons as dropdown options
   */
  const seasonOptions = computed(() =>
    seasons.value.map((s: any) => ({
      label: s.name,
      value: s.id
    }))
  )

  /**
   * Fetch all seasons (uses cache, call refresh() to force refetch)
   */
  async function fetchSeasons() {
    hasActiveFilter.value = false
    if (!seasonsData.value) {
      await refresh()
    }
    return seasonsData.value?.data || []
  }

  /**
   * Fetch seasons filtered by program
   * Note: This uses direct Supabase query as it's a dynamic filter
   */
  async function fetchSeasonsByProgram(programId: string) {
    hasActiveFilter.value = true
    try {
      const { data, error: fetchErr } = await supabase
        .from('program_cohort_seasons')
        .select(`
          season_id,
          seasons (
            id,
            name
          )
        `)
        .eq('program_id', programId)

      if (fetchErr) throw fetchErr

      // Extract unique seasons
      const uniqueSeasons = new Map()
      data?.forEach((item: any) => {
        if (item.seasons) {
          uniqueSeasons.set(item.seasons.id, {
            id: item.seasons.id,
            name: item.seasons.name
          })
        }
      })

      filteredSeasons.value = Array.from(uniqueSeasons.values())
      return filteredSeasons.value
    } catch (err: any) {
      console.error('Error fetching seasons by program:', err)
      throw new Error(err?.message || 'Failed to fetch seasons by program')
    }
  }

  /**
   * Create a new season assignment
   */
  async function createSeason(seasonData: {
    program_id: string
    cohort_id: string
    season_id: string
    start_date: string
    end_date: string
  }) {
    try {
      const response = await $fetch('/api/program-cohort-seasons/create', {
        method: 'POST',
        body: seasonData
      })

      // Invalidate related caches
      await Promise.all([
        refreshNuxtData(CACHE_KEYS.SEASONS),
        refreshNuxtData(CACHE_KEYS.COHORTS)
      ])

      return response
    } catch (err: any) {
      const errorMessage = err?.data?.statusMessage || err?.message || 'Failed to create season'
      console.error('Error creating season:', err)
      throw new Error(errorMessage)
    }
  }

  /**
   * Get a single season by ID
   */
  function getSeasonById(id: string) {
    return seasons.value.find((s: any) => s.id === id)
  }

  return {
    seasons,
    seasonOptions,
    loading,
    error,
    fetchSeasons,
    fetchSeasonsByProgram,
    createSeason,
    getSeasonById,
    refresh
  }
}
