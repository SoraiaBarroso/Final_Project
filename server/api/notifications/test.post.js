import { createError } from 'h3'
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { type } = body

        if (!type || !['email', 'slack'].includes(type)) {
            throw new Error('Invalid notification type. Must be "email" or "slack"')
        }

        const client = await serverSupabaseClient(event)

        // Get notification settings
        const { data: settings, error } = await client
            .from('notification_settings')
            .select('*')
            .single()

        if (error && error.code !== 'PGRST116') {
            throw error
        }

        if (!settings) {
            throw new Error('Notification settings not configured')
        }

        // Create test data
        const testChanges = [
            {
                student_id: 'test-123',
                name: 'Test Student',
                email: 'test.student@example.com',
                cohort: 'Test Cohort',
                program: 'Test Program',
                previous_status: 'On Track',
                current_status: 'At Risk',
                changed_at: new Date().toISOString()
            }
        ]

        let result

        if (type === 'email') {
            if (!settings.email_enabled || !settings.email_recipients?.length) {
                throw new Error('Email notifications not enabled or no recipients configured')
            }

            result = await $fetch('/api/notifications/send-email', {
                method: 'POST',
                body: {
                    recipients: settings.email_recipients,
                    changes: testChanges
                }
            })
        } else if (type === 'slack') {
            if (!settings.slack_enabled || !settings.slack_webhook_url) {
                throw new Error('Slack notifications not enabled or webhook URL not configured')
            }

            result = await $fetch('/api/notifications/send-slack', {
                method: 'POST',
                body: {
                    webhook_url: settings.slack_webhook_url,
                    changes: testChanges
                }
            })
        }

        return {
            success: true,
            message: `Test ${type} notification sent successfully`,
            result
        }

    } catch (err) {
        console.error('Test notification error:', err)
        throw createError({
            statusCode: 500,
            statusMessage: err?.message || 'Failed to send test notification'
        })
    }
})
