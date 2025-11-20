<script setup lang="ts">
import { onMounted } from 'vue'

definePageMeta({
  layout: "default",
  middleware: ["admin"],
});

const emails = ref<string[]>([])

// Use composables
const { validateEmails, isNotEmpty } = useValidation()
const { addAdmins: addAdminsApi, loading: adminLoading } = useAdminApi()
const { showSuccess, showError } = useNotifications()
const { settings, loading: settingsLoading, fetchSettings, updateSettings, testNotification } = useNotificationSettings()

// Notification settings form
const notificationEmails = ref<string[]>([])
const slackWebhookUrl = ref('')
const emailEnabled = ref(false)
const slackEnabled = ref(false)
const notifyOnAtRisk = ref(true)
const notifyOnMonitor = ref(true)
const notificationTime = ref('09:00')

onMounted(async () => {
  try {
    const data = await fetchSettings()
    if (data) {
      notificationEmails.value = data.email_recipients || []
      slackWebhookUrl.value = data.slack_webhook_url || ''
      emailEnabled.value = data.email_enabled || false
      slackEnabled.value = data.slack_enabled || false
      notifyOnAtRisk.value = data.notify_on_at_risk !== false
      notifyOnMonitor.value = data.notify_on_monitor !== false
      notificationTime.value = data.notification_time || '09:00'
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
})

async function addAdmins() {
  if (!isNotEmpty(emails.value)) {
    showError('Error', 'Please enter at least one email address')
    return
  }

  const validation = validateEmails(emails.value)

  if (!validation.isValid) {
    showError('Error', `Invalid email(s): ${validation.invalid.join(', ')}`)
    return
  }

  try {
    const response = await addAdminsApi(emails.value)
    let description = response.message || `Successfully added ${response.added} admin user(s)`

    if (response.skipped > 0) {
      description += `. ${response.skipped} email(s) already exist as admin(s).`
    }

    showSuccess('Success', description)
    emails.value = []
  } catch (error: any) {
    showError('Error', error.data?.message || 'Failed to add admin users')
  }
}

async function saveNotificationSettings() {
  try {
    // Validate notification emails if email is enabled
    if (emailEnabled.value) {
      if (!isNotEmpty(notificationEmails.value)) {
        showError('Error', 'Please add at least one email recipient')
        return
      }

      const validation = validateEmails(notificationEmails.value)
      if (!validation.isValid) {
        showError('Error', `Invalid email(s): ${validation.invalid.join(', ')}`)
        return
      }
    }

    // Validate Slack webhook if Slack is enabled
    if (slackEnabled.value && !slackWebhookUrl.value) {
      showError('Error', 'Please enter a Slack webhook URL')
      return
    }

    await updateSettings({
      email_enabled: emailEnabled.value,
      slack_enabled: slackEnabled.value,
      email_recipients: notificationEmails.value,
      slack_webhook_url: slackWebhookUrl.value,
      notify_on_at_risk: notifyOnAtRisk.value,
      notify_on_monitor: notifyOnMonitor.value,
      notification_time: notificationTime.value
    })

    showSuccess('Success', 'Notification settings saved successfully')
  } catch (error: any) {
    showError('Error', error?.message || 'Failed to save notification settings')
  }
}

async function sendTestNotification(type: 'email' | 'slack') {
  try {
    await testNotification(type)
    showSuccess('Success', `Test ${type} notification sent successfully`)
  } catch (error: any) {
    showError('Error', error?.message || `Failed to send test ${type} notification`)
  }
}
</script>

<template>
      <UDashboardPanel id="settings">
        <template #header>
            <UDashboardNavbar title="Settings" >
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="mt-6 w-full lg:max-w-4xl mx-auto gap-6 space-y-8">
                <!-- Admin Management Section -->
                <div>
                    <h1 class="text-highlighted font-medium text-left w-full">Admin Management</h1>
                    <p class="text-muted text-[15px] text-pretty mt-1">Manage admin users</p>

                    <UCard
                        variant="subtle"
                        class="mt-4"
                        :ui="{ body: '!py-4 w-full !px-8' }"
                    >
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-highlighted mb-2">
                                    Add Admin Users
                                </label>
                                <p class="text-muted text-sm mb-3">
                                    Enter email addresses to grant admin access. Press Enter to add multiple emails.
                                </p>
                                <UInputTags
                                    v-model="emails"
                                    placeholder="Enter email addresses..."
                                    size="md"
                                    class="w-full"
                                />
                            </div>

                            <UButton
                                @click="addAdmins"
                                :loading="adminLoading"
                                :disabled="emails.length === 0"
                                color="primary"
                                variant="subtle"
                                block
                            >
                                Add {{ emails.length > 0 ? emails.length : '' }} Admin{{ emails.length !== 1 ? 's' : '' }}
                            </UButton>
                        </div>
                    </UCard>
                </div>

                <!-- Notification Settings Section -->
                <div>
                    <h1 class="text-highlighted font-medium text-left w-full">Student Status Notifications</h1>
                    <p class="text-muted text-[15px] text-pretty mt-1">
                        Configure automated notifications for student status changes
                    </p>

                    <UCard
                        variant="subtle"
                        class="mt-4"
                        :ui="{ body: '!py-4 w-full !px-8' }"
                    >
                        <div class="space-y-6">
                            <!-- Email Notifications -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="text-sm font-medium text-highlighted">Email Notifications</h3>
                                        <p class="text-muted text-xs mt-1">Send alerts via email</p>
                                    </div>
                                    <USwitch v-model="emailEnabled" />
                                </div>

                                <div v-if="emailEnabled" class="space-y-3 pl-4 border-l-2 border-primary/20">
                                    <div>
                                        <label class="block text-sm font-medium text-highlighted mb-2">
                                            Email Recipients
                                        </label>
                                        <p class="text-muted text-xs mb-2">
                                            Add email addresses to receive notifications
                                        </p>
                                        <UInputTags
                                            v-model="notificationEmails"
                                            placeholder="Enter email addresses..."
                                            size="md"
                                            class="w-full"
                                        />
                                    </div>

                                    <UButton
                                        @click="sendTestNotification('email')"
                                        :loading="settingsLoading"
                                        size="sm"
                                        color="neutral"
                                        variant="outline"
                                        icon="i-lucide-send"
                                    >
                                        Send Test Email
                                    </UButton>
                                </div>
                            </div>

                            <UDivider />

                            <!-- Slack Notifications -->
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h3 class="text-sm font-medium text-highlighted">Slack Notifications</h3>
                                        <p class="text-muted text-xs mt-1">Send alerts to a Slack channel</p>
                                    </div>
                                    <USwitch v-model="slackEnabled" />
                                </div>

                                <div v-if="slackEnabled" class="space-y-3 pl-4 border-l-2 border-primary/20">
                                    <div>
                                        <label class="block text-sm font-medium text-highlighted mb-2">
                                            Slack Webhook URL
                                        </label>
                                        <p class="text-muted text-xs mb-2">
                                            <a href="https://api.slack.com/messaging/webhooks" target="_blank" class="text-primary hover:underline">
                                                Create a webhook URL
                                            </a> for your Slack channel
                                        </p>
                                        <UInput
                                            v-model="slackWebhookUrl"
                                            placeholder="https://hooks.slack.com/services/..."
                                            size="md"
                                            type="url"
                                            class="w-full"
                                        />
                                    </div>

                                    <UButton
                                        @click="sendTestNotification('slack')"
                                        :loading="settingsLoading"
                                        size="sm"
                                        color="neutral"
                                        variant="outline"
                                        icon="i-lucide-send"
                                    >
                                        Send Test Message
                                    </UButton>
                                </div>
                            </div>

                            <UDivider />

                            <!-- Notification Triggers -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-medium text-highlighted">Notification Triggers</h3>
                                <p class="text-muted text-xs">Choose which status changes trigger notifications</p>

                                <div class="space-y-3">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <label class="text-sm text-highlighted">Notify on "At Risk"</label>
                                            <p class="text-muted text-xs">Send alert when student status changes to At Risk</p>
                                        </div>
                                        <USwitch v-model="notifyOnAtRisk" color="error" />
                                    </div>

                                    <div class="flex items-center justify-between">
                                        <div>
                                            <label class="text-sm text-highlighted">Notify on "Monitor"</label>
                                            <p class="text-muted text-xs">Send alert when student status changes to Monitor</p>
                                        </div>
                                        <USwitch v-model="notifyOnMonitor" color="warning" />
                                    </div>
                                </div>
                            </div>

                            <UDivider />

                            <!-- Schedule -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-medium text-highlighted">Notification Schedule</h3>
                                <p class="text-muted text-xs">Time to check for status changes daily (24-hour format)</p>

                                <UInput
                                    v-model="notificationTime"
                                    type="time"
                                    size="md"
                                    class="w-full max-w-xs"
                                />
                            </div>

                            <!-- Save Button -->
                            <UButton
                                @click="saveNotificationSettings"
                                :loading="settingsLoading"
                                color="primary"
                                variant="subtle"
                                icon="i-lucide-save"
                                block
                            >
                                Save Notification Settings
                            </UButton>
                        </div>
                    </UCard>
                </div>
            </div>
        </template>
    </UDashboardPanel>
</template>