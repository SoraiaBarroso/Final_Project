export function useSeasons() {
  const supabase = useSupabaseClient()
  const seasons = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Computed property to get seasons as dropdown options
   */
  const seasonOptions = computed(() =>
    seasons.value.map(s => ({
      label: s.name,
      value: s.id
    }))
  )

  /**
   * Fetch all seasons from the database
   */
  async function fetchSeasons() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('seasons')
        .select('id, name')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      seasons.value = data || []
      return data
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch seasons'
      console.error('Error fetching seasons:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch seasons filtered by program
   */
  async function fetchSeasonsByProgram(programId: string) {
    loading.value = true
    error.value = null
    try {
      // Get seasons for the selected program through program_cohort_seasons
      const { data, error: fetchError } = await supabase
        .from('program_cohort_seasons')
        .select(`
          season_id,
          seasons (
            id,
            name
          )
        `)
        .eq('program_id', programId)

      if (fetchError) throw fetchError

      // Extract unique seasons (avoid duplicates)
      const uniqueSeasons = new Map()
      data?.forEach((item: any) => {
        if (item.seasons) {
          uniqueSeasons.set(item.seasons.id, {
            id: item.seasons.id,
            name: item.seasons.name
          })
        }
      })

      seasons.value = Array.from(uniqueSeasons.values())
      return seasons.value
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch seasons by program'
      console.error('Error fetching seasons by program:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new season
   */
  async function createSeason(seasonData: {
    program_id: string
    cohort_id: string
    season_id: string
    start_date: string
    end_date: string
  }) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/program-cohort-seasons/create', {
        method: 'POST',
        body: seasonData
      })
      return response
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to create season'
      console.error('Error creating season:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a single season by ID
   */
  function getSeasonById(id: string) {
    return seasons.value.find(s => s.id === id)
  }

  return {
    seasons,
    seasonOptions,
    loading,
    error,
    fetchSeasons,
    fetchSeasonsByProgram,
    createSeason,
    getSeasonById
  }
}
