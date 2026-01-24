import type { NotificationSettings } from '~/types'

export function useNotificationSettings() {
  const supabase = useSupabaseClient()
  const settings = ref<NotificationSettings | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch notification settings from the database
   */
  async function fetchSettings() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('notification_settings')
        .select('*')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw fetchError
      }

      settings.value = data || {
        email_enabled: false,
        slack_enabled: false,
        email_recipients: [],
        slack_webhook_url: '',
        notify_on_at_risk: true,
        notify_on_monitor: true,
        notification_time: '09:00'
      }

      return settings.value
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notification settings'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update notification settings
   */
  async function updateSettings(newSettings: Partial<NotificationSettings>) {
    loading.value = true
    error.value = null
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('notification_settings')
        .select('id')
        .single()

      let result

      if (existing) {
        // Update existing settings
        result = await supabase
          .from('notification_settings')
          .update(newSettings)
          .eq('id', existing.id)
          .select()
          .single()
      } else {
        // Insert new settings
        result = await supabase
          .from('notification_settings')
          .insert(newSettings)
          .select()
          .single()
      }

      if (result.error) throw result.error

      settings.value = result.data
      return result.data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update notification settings'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Test notification sending (sends a test alert)
   */
  async function testNotification(type: 'email' | 'slack') {
    loading.value = true
    error.value = null
    try {
      const response = await $fetch('/api/notifications/test', {
        method: 'POST',
        body: { type }
      })
      return response
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    testNotification
  }
}
