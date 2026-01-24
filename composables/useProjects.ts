import type { Project, DropdownOption } from '~/types'

export function useProjects() {
  const supabase = useSupabaseClient()
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Computed property to get projects as dropdown options
   */
  const projectOptions = computed<DropdownOption[]>(() =>
    projects.value.map((p) => ({
      label: p.name,
      value: p.id
    }))
  )

  /**
   * Fetch all projects from the database
   */
  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, program_id, season_id')
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      projects.value = data || []
      return data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get projects filtered by program
   */
  function getProjectsByProgram(programId: string) {
    return projects.value.filter(p => p.program_id === programId)
  }

  /**
   * Get projects filtered by season
   */
  function getProjectsBySeason(seasonId: string) {
    return projects.value.filter(p => p.season_id === seasonId)
  }

  /**
   * Get projects filtered by program IDs
   */
  function getProjectsByPrograms(programIds: string[]) {
    return projects.value.filter(p =>
      !p.program_id || programIds.includes(String(p.program_id))
    )
  }

  /**
   * Get projects filtered by season IDs
   */
  function getProjectsBySeasons(seasonIds: string[]) {
    return projects.value.filter(p =>
      !p.season_id || seasonIds.includes(String(p.season_id))
    )
  }

  /**
   * Get a single project by ID
   */
  function getProjectById(id: string) {
    return projects.value.find(p => p.id === id)
  }

  return {
    projects,
    projectOptions,
    loading,
    error,
    fetchProjects,
    getProjectsByProgram,
    getProjectsBySeason,
    getProjectsByPrograms,
    getProjectsBySeasons,
    getProjectById
  }
}
