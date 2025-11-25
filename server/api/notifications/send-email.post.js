import { createError } from 'h3'

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event)
        const { recipients, changes } = body

        if (!recipients || recipients.length === 0) {
            throw new Error('No recipients specified')
        }

        if (!changes || changes.length === 0) {
            throw new Error('No status changes to report')
        }

        // Group changes by status
        const atRiskStudents = changes.filter(c => c.current_status === 'At Risk')
        const monitorStudents = changes.filter(c => c.current_status === 'Monitor')

        // Build email HTML content
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .header h1 { margin: 0; color: #dc3545; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px; }
        .student-card { background-color: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #dc3545; }
        .student-card.warning { border-left-color: #ffc107; }
        .student-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
        .student-details { font-size: 14px; color: #6c757d; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-top: 8px; }
        .status-badge.at-risk { background-color: #dc3545; color: white; }
        .status-badge.monitor { background-color: #ffc107; color: #000; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Student Status Alert</h1>
            <p>The following students have changed status and may need attention:</p>
        </div>

        ${atRiskStudents.length > 0 ? `
        <div class="section">
            <h2>Students At Risk (${atRiskStudents.length})</h2>
            ${atRiskStudents.map(student => `
            <div class="student-card">
                <div class="student-name">${student.name}</div>
                <div class="student-details">
                    <strong>Email:</strong> ${student.email}<br>
                    <strong>Program:</strong> ${student.program}<br>
                    <strong>Cohort:</strong> ${student.cohort}<br>
                    <strong>Previous Status:</strong> ${student.previous_status || 'N/A'}
                </div>
                <span class="status-badge at-risk">AT RISK</span>
            </div>
            `).join('')}
        </div>
        ` : ''}

        ${monitorStudents.length > 0 ? `
        <div class="section">
            <h2>Students to Monitor (${monitorStudents.length})</h2>
            ${monitorStudents.map(student => `
            <div class="student-card warning">
                <div class="student-name">${student.name}</div>
                <div class="student-details">
                    <strong>Email:</strong> ${student.email}<br>
                    <strong>Program:</strong> ${student.program}<br>
                    <strong>Cohort:</strong> ${student.cohort}<br>
                    <strong>Previous Status:</strong> ${student.previous_status || 'N/A'}
                </div>
                <span class="status-badge monitor">MONITOR</span>
            </div>
            `).join('')}
        </div>
        ` : ''}

        <div class="footer">
            <p>This is an automated notification from the Student Management System.</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>
        `

        // Plain text version
        const textContent = `
Student Status Alert

The following students have changed status and may need attention:

${atRiskStudents.length > 0 ? `
Students At Risk (${atRiskStudents.length}):
${atRiskStudents.map(s => `
- ${s.name}
  Email: ${s.email}
  Program: ${s.program}
  Cohort: ${s.cohort}
  Previous Status: ${s.previous_status || 'N/A'}
  Current Status: AT RISK
`).join('\n')}
` : ''}

${monitorStudents.length > 0 ? `
Students to Monitor (${monitorStudents.length}):
${monitorStudents.map(s => `
- ${s.name}
  Email: ${s.email}
  Program: ${s.program}
  Cohort: ${s.cohort}
  Previous Status: ${s.previous_status || 'N/A'}
  Current Status: MONITOR
`).join('\n')}
` : ''}

---
This is an automated notification from the Student Management System.
Generated on: ${new Date().toLocaleString()}
        `

        // Send email using nuxt-nodemailer
        const { sendMail } = useNodeMailer()

        console.log('Sending email to:', recipients)
        console.log('Changes:', changes.length)

        const result = await sendMail({
            to: recipients.join(', '),
            subject: `🚨 Student Status Alert - ${changes.length} student(s) need attention`,
            html: htmlContent,
            text: textContent
        })

        return {
            success: true,
            message: `Email notification sent successfully to ${recipients.length} recipient(s)`,
            recipients,
            changes_count: changes.length,
            messageId: result.messageId
        }

    } catch (err) {
        console.error('Email notification error:', err)
        throw createError({
            statusCode: 500,
            statusMessage: err?.message || 'Failed to send email notification'
        })
    }
})
