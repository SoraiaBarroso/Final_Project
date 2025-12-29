/**
 * Composable for managing cache invalidation
 * Use this to clear and refresh cached data after admin mutations
 */
export function useCacheInvalidation() {
  const nuxtApp = useNuxtApp()

  /**
   * Invalidate a specific cache entry by key
   * @param key - The cache key to invalidate (e.g., 'cohorts', 'programs')
   */
  function invalidateCache(key?: string) {
    if (key) {
      delete nuxtApp.payload.data[key]
    } else {
      // Clear all cached data
      nuxtApp.payload.data = {}
    }
  }

  /**
   * Invalidate cache and immediately refresh the data
   * @param key - The cache key to refresh
   */
  async function refreshData(key: string) {
    invalidateCache(key)
    await refreshNuxtData(key)
  }

  /**
   * Refresh multiple cache keys at once
   * @param keys - Array of cache keys to refresh
   */
  async function refreshMultiple(keys: string[]) {
    keys.forEach(key => invalidateCache(key))
    await Promise.all(keys.map(key => refreshNuxtData(key)))
  }

  /**
   * Clear all cache and optionally refresh specific keys
   * @param refreshKeys - Optional array of keys to refresh after clearing
   */
  async function clearAllCache(refreshKeys?: string[]) {
    invalidateCache()
    if (refreshKeys?.length) {
      await Promise.all(refreshKeys.map(key => refreshNuxtData(key)))
    }
  }

  return {
    invalidateCache,
    refreshData,
    refreshMultiple,
    clearAllCache
  }
}

/**
 * Cache keys used throughout the application
 * Use these constants for consistency
 */
export const CACHE_KEYS = {
  PROGRAMS: 'programs',
  COHORTS: 'cohorts',
  SEASONS: 'seasons',
  ATTENDANCE: 'attendance',
  ATTENDANCE_BY_COHORT: 'attendance-by-cohort',
  STUDENTS: 'students',
  DASHBOARD_STUDENTS: 'dashboard-students',
  SNAPSHOT: 'snapshot',
  // Admin student details
  studentDetails: (id: string | number) => `student-${id}`,
  studentProjects: (id: string | number) => `student-${id}-projects`,
  studentSeasons: (id: string | number) => `student-${id}-seasons`,
  // Student portal data (keyed by email for current user)
  STUDENT_DASHBOARD: 'student-dashboard',
  STUDENT_ROADMAP: 'student-roadmap',
  STUDENT_SEASON_PROGRESS: 'student-season-progress',
  STUDENT_CALENDAR_TODAY: 'student-calendar-today',
  STUDENT_CALENDAR_WEEK: 'student-calendar-week',
  STUDENT_CALENDAR_MONTH: 'student-calendar-month',
  // Timeline data
  STUDENT_TIMELINE_SEASONS: 'student-timeline-seasons',
  studentTimelineProjects: (seasonId: string | number) => `student-timeline-projects-${seasonId}`
} as const
