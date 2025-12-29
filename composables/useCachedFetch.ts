/**
 * Composable for cached data fetching using Nuxt's built-in caching
 * Prevents unnecessary refetches when navigating between views
 */
export function useCachedFetch<T>(url: string | (() => string), options?: { key?: string }) {
  const nuxtApp = useNuxtApp()

  // Support both static URLs and computed URLs
  const resolvedUrl = typeof url === 'function' ? url() : url
  const cacheKey = options?.key || resolvedUrl

  return useFetch<T>(resolvedUrl, {
    key: cacheKey,
    getCachedData(key) {
      // Return cached data if available (prevents refetch on navigation)
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })
}

/**
 * Cached fetch with lazy loading - data is not fetched until explicitly triggered
 */
export function useLazyCachedFetch<T>(url: string, options?: { key?: string }) {
  const nuxtApp = useNuxtApp()
  const cacheKey = options?.key || url

  return useLazyFetch<T>(url, {
    key: cacheKey,
    getCachedData(key) {
      return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
    }
  })
}
