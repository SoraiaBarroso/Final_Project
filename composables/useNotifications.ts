export function useNotifications() {
  const toast = useToast()

  /**
   * Show a success notification
   */
  function showSuccess(title: string, description?: string, icon?: string) {
    toast.add({
      title,
      description,
      color: 'success',
      icon: icon || 'i-lucide-check-circle'
    })
  }

  /**
   * Show an error notification
   */
  function showError(title: string, description?: string, icon?: string) {
    toast.add({
      title,
      description,
      color: 'error',
      icon: icon || 'i-lucide-circle-x'
    })
  }

  /**
   * Show a warning notification
   */
  function showWarning(title: string, description?: string, icon?: string) {
    toast.add({
      title,
      description,
      color: 'warning',
      icon: icon || 'i-lucide-alert-triangle'
    })
  }

  /**
   * Show an info notification
   */
  function showInfo(title: string, description?: string, icon?: string) {
    toast.add({
      title,
      description,
      color: 'info',
      icon: icon || 'i-lucide-info'
    })
  }

  /**
   * Show a generic notification with custom color
   */
  function show(title: string, description?: string, color?: string, icon?: string) {
    toast.add({
      title,
      description,
      color: color || 'primary',
      icon
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    show
  }
}
