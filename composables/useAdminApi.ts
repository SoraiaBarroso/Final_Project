export function useAdminApi() {
  const admins = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all admins from the database
   */
  async function fetchAdmins() {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/admin/list')
      admins.value = response?.data || []
      return response
    } catch (err: any) {
      error.value = err?.message || 'Failed to fetch admins'
      console.error('Error fetching admins:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Add new admin users by email
   */
  async function addAdmins(emails: string[]) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/admin/add', {
        method: 'POST',
        body: { emails }
      })
      return response
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to add admin users'
      console.error('Error adding admins:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Remove an admin user by email
   */
  async function removeAdmin(email: string) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/admin/remove', {
        method: 'POST',
        body: { email }
      })
      // Refresh the admins list after removal
      await fetchAdmins()
      return response
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to remove admin'
      console.error('Error removing admin:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Check if a user has admin privileges
   */
  async function checkAdminStatus(email: string) {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/admin/check', {
        method: 'POST',
        body: { email }
      })
      return response
    } catch (err: any) {
      error.value = err?.data?.statusMessage || err?.message || 'Failed to check admin status'
      console.error('Error checking admin status:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    admins,
    loading,
    error,
    fetchAdmins,
    addAdmins,
    removeAdmin,
    checkAdminStatus
  }
}
