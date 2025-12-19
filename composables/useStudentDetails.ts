import { ref } from 'vue'

export function useStudentDetails() {
  const student = ref<any | null>(null)
  const projectCompletions = ref<any[]>([])
  const seasonProgress = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Internal fetch functions without loading state management
   */
  async function _fetchStudentDetails(studentId: string | number) {
    const res = await $fetch(`/api/students/${studentId}`)
    if (!res?.data) throw new Error('Failed to fetch student details')
    student.value = res.data
  }

  async function _fetchProjectCompletions(studentId: string | number) {
    const res = await $fetch(`/api/students/${studentId}/project-completions`)
    if (!res?.data) throw new Error('Failed to fetch project completions')
    projectCompletions.value = res.data
  }

  async function _fetchSeasonProgress(studentId: string | number) {
    const res = await $fetch(`/api/students/${studentId}/season-progress`)
    if (!res?.data) throw new Error('Failed to fetch season progress')
    seasonProgress.value = res.data
  }

  /**
   * Fetch complete student details including related data
   */
  async function fetchStudentDetails(studentId: string | number) {
    loading.value = true
    error.value = null
    try {
      await _fetchStudentDetails(studentId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      student.value = null
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch student's project completions
   */
  async function fetchProjectCompletions(studentId: string | number) {
    loading.value = true
    error.value = null
    try {
      await _fetchProjectCompletions(studentId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      projectCompletions.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch student's season progress with complete season list
   */
  async function fetchSeasonProgress(studentId: string | number) {
    loading.value = true
    error.value = null
    try {
      await _fetchSeasonProgress(studentId)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      seasonProgress.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch all student data at once
   */
  async function fetchAllStudentData(studentId: string | number) {
    loading.value = true
    error.value = null
    try {
      // Fetch all data in parallel
      await Promise.all([
        _fetchStudentDetails(studentId),
        _fetchProjectCompletions(studentId),
        _fetchSeasonProgress(studentId)
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

  return {
    student,
    projectCompletions,
    seasonProgress,
    loading,
    error,
    fetchStudentDetails,
    fetchProjectCompletions,
    fetchSeasonProgress,
    fetchAllStudentData
  }
}
