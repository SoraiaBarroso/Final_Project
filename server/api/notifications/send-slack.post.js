import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { webhook_url, changes } = body

        if (!webhook_url) {
            throw new Error('Slack webhook URL not provided')
        }

        if (!changes || changes.length === 0) {
            throw new Error('No status changes to report')
        }

        // Group changes by status
        const atRiskStudents = changes.filter(c => c.current_status === 'At Risk')
        const monitorStudents = changes.filter(c => c.current_status === 'Monitor')

        // Build Slack message blocks
        const blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "🚨 Student Status Alert",
                    "emoji": true
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*${changes.length} student(s)* have changed status and may need attention.`
                }
            },
            {
                "type": "divider"
            }
        ]

        // Add At Risk students section
        if (atRiskStudents.length > 0) {
            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Students At Risk (${atRiskStudents.length})*\n:red_circle: These students need immediate attention`
                }
            })

            atRiskStudents.forEach(student => {
                blocks.push({
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": `*Name:*\n${student.name}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Email:*\n${student.email}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Program:*\n${student.program}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Cohort:*\n${student.cohort}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Previous Status:*\n${student.previous_status || 'N/A'}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Current Status:*\n:red_circle: *AT RISK*`
                        }
                    ]
                })
            })

            blocks.push({ "type": "divider" })
        }

        // Add Monitor students section
        if (monitorStudents.length > 0) {
            blocks.push({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `*Students to Monitor (${monitorStudents.length})*\n:yellow_circle: These students should be monitored closely`
                }
            })

            monitorStudents.forEach(student => {
                blocks.push({
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": `*Name:*\n${student.name}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Email:*\n${student.email}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Program:*\n${student.program}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Cohort:*\n${student.cohort}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Previous Status:*\n${student.previous_status || 'N/A'}`
                        },
                        {
                            "type": "mrkdwn",
                            "text": `*Current Status:*\n:yellow_circle: *MONITOR*`
                        }
                    ]
                })
            })

            blocks.push({ "type": "divider" })
        }

        // Add footer
        blocks.push({
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": `Generated on: ${new Date().toLocaleString()}`
                }
            ]
        })

        // Send to Slack webhook
        const response = await $fetch(webhook_url, {
            method: 'POST',
            body: {
                blocks,
                text: `Student Status Alert: ${changes.length} student(s) need attention`
            }
        })

        console.log('Slack notification sent successfully')

        return {
            success: true,
            message: 'Slack notification sent successfully',
            changes_count: changes.length
        }

    } catch (err) {
        console.error('Slack notification error:', err)
        throw createError({
            statusCode: 500,
            statusMessage: err?.message || 'Failed to send Slack notification'
        })
    }
})
