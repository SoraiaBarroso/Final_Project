import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_KEY must be set in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse CSV file
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',')

  const data = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = line.split(',')
    if (values.length === headers.length) {
      const row = {}
      headers.forEach((header, index) => {
        row[header.trim()] = values[index].trim()
      })

      // Only add rows with valid username and slack_id
      if (row.username && row.username !== '-' && row.slack_id) {
        data.push(row)
      }
    }
  }

  return data
}

// Update students with slack IDs
async function updateSlackIds() {
  try {
    // Read CSV file
    const csvPath = join(__dirname, 'user_slack_ids.csv')
    const csvContent = readFileSync(csvPath, 'utf-8')
    const userData = parseCSV(csvContent)

    console.log(`Found ${userData.length} users in CSV file`)

    let successCount = 0
    let notFoundCount = 0
    let errorCount = 0
    const notFoundUsers = []

    // Update each student
    for (const user of userData) {
      try {
        // Find student by username
        const { data: student, error: findError } = await supabase
          .from('students')
          .select('id, username, slack_id')
          .eq('username', user.username)
          .single()

        if (findError || !student) {
          console.log(`❌ Student not found: ${user.username}`)
          notFoundCount++
          notFoundUsers.push(user.username)
          continue
        }

        // Update slack_id
        const { error: updateError } = await supabase
          .from('students')
          .update({ slack_id: user.slack_id })
          .eq('id', student.id)

        if (updateError) {
          console.error(`❌ Error updating ${user.username}:`, updateError.message)
          errorCount++
        } else {
          console.log(`✅ Updated ${user.username} with slack_id: ${user.slack_id}`)
          successCount++
        }
      } catch (err) {
        console.error(`❌ Error processing ${user.username}:`, err.message)
        errorCount++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50))
    console.log('UPDATE SUMMARY')
    console.log('='.repeat(50))
    console.log(`✅ Successfully updated: ${successCount}`)
    console.log(`❌ Not found in database: ${notFoundCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📊 Total processed: ${userData.length}`)

    if (notFoundUsers.length > 0) {
      console.log('\nUsers not found in database:')
      notFoundUsers.forEach(username => console.log(`  - ${username}`))
    }

  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
updateSlackIds()
