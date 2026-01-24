import { CACHE_KEYS } from './useCacheInvalidation'
import type { StudentDetails, ProjectCompletion, SeasonProgress } from '~/types'
import type { ApiResponse, ApiListResponse } from '~/types'

export function useStudentDetails() {
  const nuxtApp = useNuxtApp()

  // Reactive state
  const student = ref<StudentDetails | null>(null)
  const projectCompletions = ref<ProjectCompletion[]>([])
  const seasonProgress = ref<SeasonProgress[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Track current student ID for cache key generation
  const currentStudentId = ref<string | number | null>(null)

  /**
   * Check if data is cached for a given student
   */
  function getCachedStudentData(studentId: string | number) {
    const detailsKey = CACHE_KEYS.studentDetails(studentId)
    const projectsKey = CACHE_KEYS.studentProjects(studentId)
    const seasonsKey = CACHE_KEYS.studentSeasons(studentId)

    return {
      details: nuxtApp.payload.data[detailsKey],
      projects: nuxtApp.payload.data[projectsKey],
      seasons: nuxtApp.payload.data[seasonsKey]
    }
  }

  /**
   * Fetch student details with caching
   */
  async function fetchStudentDetails(studentId: string | number, forceRefresh = false) {
    currentStudentId.value = studentId
    const cacheKey = CACHE_KEYS.studentDetails(studentId)

    // Check cache first
    if (!forceRefresh) {
      const cached = nuxtApp.payload.data[cacheKey]
      if (cached?.data) {
        student.value = cached.data
        return
      }
    }

    loading.value = true
    error.value = null
    try {
      const res = await $fetch<ApiResponse<StudentDetails>>(`/api/students/${studentId}`)
      if (!res?.data) throw new Error('Failed to fetch student details')

      student.value = res.data

      // Store in cache
      nuxtApp.payload.data[cacheKey] = res
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      student.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch student's project completions with caching
   */
  async function fetchProjectCompletions(studentId: string | number, forceRefresh = false) {
    currentStudentId.value = studentId
    const cacheKey = CACHE_KEYS.studentProjects(studentId)

    // Check cache first
    if (!forceRefresh) {
      const cached = nuxtApp.payload.data[cacheKey]
      if (cached?.data) {
        projectCompletions.value = cached.data
        return
      }
    }

    loading.value = true
    error.value = null
    try {
      const res = await $fetch<ApiListResponse<ProjectCompletion>>(`/api/students/${studentId}/project-completions`)
      if (!res?.data) throw new Error('Failed to fetch project completions')

      projectCompletions.value = res.data

      // Store in cache
      nuxtApp.payload.data[cacheKey] = res
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      projectCompletions.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch student's season progress with caching
   */
  async function fetchSeasonProgress(studentId: string | number, forceRefresh = false) {
    currentStudentId.value = studentId
    const cacheKey = CACHE_KEYS.studentSeasons(studentId)

    // Check cache first
    if (!forceRefresh) {
      const cached = nuxtApp.payload.data[cacheKey]
      if (cached?.data) {
        seasonProgress.value = cached.data
        return
      }
    }

    loading.value = true
    error.value = null
    try {
      const res = await $fetch<ApiListResponse<SeasonProgress>>(`/api/students/${studentId}/season-progress`)
      if (!res?.data) throw new Error('Failed to fetch season progress')

      seasonProgress.value = res.data

      // Store in cache
      nuxtApp.payload.data[cacheKey] = res
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      seasonProgress.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch all student data at once with caching
   */
  async function fetchAllStudentData(studentId: string | number, forceRefresh = false) {
    currentStudentId.value = studentId

    // Check if all data is cached
    if (!forceRefresh) {
      const cached = getCachedStudentData(studentId)
      if (cached.details?.data && cached.projects?.data && cached.seasons?.data) {
        student.value = cached.details.data
        projectCompletions.value = cached.projects.data
        seasonProgress.value = cached.seasons.data
        return
      }
    }

    loading.value = true
    error.value = null
    try {
      // Fetch all data in parallel
      await Promise.all([
        fetchStudentDetails(studentId, forceRefresh),
        fetchProjectCompletions(studentId, forceRefresh),
        fetchSeasonProgress(studentId, forceRefresh)
      ])
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      student.value = null
      projectCompletions.value = []
      seasonProgress.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Invalidate cache for a specific student
   */
  function invalidateStudentCache(studentId?: string | number) {
    const id = studentId || currentStudentId.value
    if (!id) return

    delete nuxtApp.payload.data[CACHE_KEYS.studentDetails(id)]
    delete nuxtApp.payload.data[CACHE_KEYS.studentProjects(id)]
    delete nuxtApp.payload.data[CACHE_KEYS.studentSeasons(id)]
  }

  return {
    student,
    projectCompletions,
    seasonProgress,
    loading,
    error,
    fetchStudentDetails,
    fetchProjectCompletions,
    fetchSeasonProgress,
    fetchAllStudentData,
    invalidateStudentCache
  }
}
