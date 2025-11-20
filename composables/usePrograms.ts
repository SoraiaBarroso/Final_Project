export function usePrograms() {
  const programs = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Computed property to get programs as dropdown options
   */
  const programOptions = computed(() =>
    programs.value.map(p => ({
      label: p.name,
      value: p.id
    }))
  )

  /**
   * Fetch all programs from the database
   */
  async function fetchPrograms() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/programs')
      programs.value = response?.data || []
      return response
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch programs'
      console.error('Error fetching programs:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a single program by ID
   */
  function getProgramById(id: string) {
    return programs.value.find(p => p.id === id)
  }

  /**
   * Get a single program by name
   */
  function getProgramByName(name: string) {
    return programs.value.find(p => p.name === name)
  }

  return {
    programs,
    programOptions,
    loading,
    error,
    fetchPrograms,
    getProgramById,
    getProgramByName
  }
}
