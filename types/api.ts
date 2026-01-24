export interface ApiResponse<T> {
  data: T
  error?: string
}

export interface ApiListResponse<T> {
  data: T[]
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
}

export interface NotificationSettings {
  id?: string
  email_enabled: boolean
  slack_enabled: boolean
  email_recipients: string[]
  slack_webhook_url: string
  notify_on_at_risk: boolean
  notify_on_monitor: boolean
  notification_time: string
}
