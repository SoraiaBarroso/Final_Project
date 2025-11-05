<script setup>
import { resolveComponent } from 'vue'
import StudentHeaderCard from '~/components/admin/student_details/StudentHeaderCard.vue'
import StudentStats from '~/components/admin/student_details/StudentStats.vue'
import SeasonProgressTable from '~/components/admin/student_details/SeasonProgressTable.vue'

definePageMeta({
  layout: 'default',
  middleware: ['admin']
})

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const UBadge = resolveComponent('UBadge')

const studentId = route.params.id
const student = ref(null)
const loading = ref(true)
const error = ref(null)

async function fetchProjectsCompleted(studentId) {
  const { count, error } = await supabase
    .from("student_project_completion")
    .select("*", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("is_completed", true);

  return count || 0;
}

// Fetch student data with all related information
const fetchStudentDetails = async () => {
  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('students')
      .select(`
        *,
        cohorts(id, name, start_date, end_date),
        programs(id, name, description),
        current_season:seasons!students_current_season_id_fkey(id, name, order_in_program),
        expected_season:seasons!students_expected_season_id_fkey(id, name, order_in_program)
      `)
      .eq('id', studentId)
      .single()

    if (fetchError) throw fetchError

    // Fetch and add completed projects count
    const completedProjects = await fetchProjectsCompleted(studentId);
    data.completed_projects = completedProjects;
    console.log("Completed Projects:", data);
    student.value = data
  } catch (err) {
    console.error('Error fetching student:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Fetch student project completions
const projectCompletions = ref([])
const fetchProjectCompletions = async () => {
  const { data, error: fetchError } = await supabase
    .from('student_project_completion')
    .select(`
      *,
      projects(id, name, description, duration_days)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (!fetchError) {
    projectCompletions.value = data || []
  }
}

// Fetch student season progress
const seasonProgress = ref([])

const fetchSeasonProgress = async () => {
  // First, get the student's cohort and program info
  const { data: studentData } = await supabase
    .from('students')
    .select('cohort_id, program_id')
    .eq('id', studentId)
    .single()

  if (!studentData) return

  // Fetch ALL seasons for the program (to show complete list)
  const { data: allSeasons, error: seasonsError } = await supabase
    .from('seasons')
    .select('id, name, order_in_program')
    .eq('program_id', studentData.program_id)
    .order('order_in_program', { ascending: true })

  if (seasonsError) {
    console.error("Error fetching all seasons:", seasonsError)
    return
  }

  // Fetch student's actual progress
  const { data: progressData, error: progressError } = await supabase
    .from('student_season_progress')
    .select('*')
    .eq('student_id', studentId)

  if (progressError) {
    console.error("Error fetching season progress:", progressError)
    return
  }

  // Fetch program_cohort_seasons for date information
  const { data: cohortSeasonsData, error: cohortSeasonsError } = await supabase
    .from('program_cohort_seasons')
    .select('season_id, start_date, end_date')
    .eq('cohort_id', studentData.cohort_id)
    .eq('program_id', studentData.program_id)

  if (cohortSeasonsError) {
    console.error("Error fetching cohort seasons:", cohortSeasonsError)
    return
  }

  // Create complete list: for each season, merge with student progress (if exists)
  const mergedData = allSeasons?.map(season => {
    // Find student's progress for this season (if any)
    const progress = progressData?.find(p => p.season_id === season.id)

    // Find cohort season dates
    const cohortSeason = cohortSeasonsData?.find(cs => cs.season_id === season.id)

    // If student has progress, use it; otherwise create default "Not Started" entry
    return {
      id: progress?.id || `placeholder-${season.id}`,
      student_id: studentId,
      season_id: season.id,
      progress_percentage: progress?.progress_percentage || 0,
      is_completed: progress?.is_completed || false,
      completion_date: progress?.completion_date || null,
      created_at: progress?.created_at || null,
      updated_at: progress?.updated_at || null,
      seasons: season,
      program_cohort_seasons: cohortSeason || null
    }
  })

  console.log("Merged Season Progress:", mergedData)
  seasonProgress.value = mergedData || []
}

onMounted(async () => {
  await fetchStudentDetails()
  await fetchProjectCompletions()
  await fetchSeasonProgress()
})

const getStatusColor = (status) => {
  const colors = {
    'On Track': 'success',
    'At Risk': 'error',
    'Monitor': 'warning',
    'Unknown': 'neutral'
  }
  return colors[status] || 'neutral'
}

// Format ISO datetime to human friendly: "28 Oct, 2024 at 23:20"
const formatDateTime = (iso) => {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null

    const day = String(d.getDate()).padStart(2, '0')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[d.getMonth()]
    const year = d.getFullYear()

    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${day} ${month}, ${year} at ${hours}:${minutes}`
  } catch (e) {
    return null
  }
}

const goBack = () => {
  router.push('/admin/dashboard')
}

const handleSendEmail = (student) => {
  // TODO: Implement email functionality
  console.log('Send email to:', student.email)
}

const handleSendSlackMessage = (student) => {
  // TODO: Implement Slack message functionality
  console.log('Send Slack message to:', student.first_name, student.last_name)
}
</script>

<template>
  <UDashboardPanel id="student-detail">
    <template #header>
      <UDashboardNavbar title="Students Details">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
        <div v-if="loading" class="flex justify-center items-center h-64">
          <ULoadingSpinner size="lg" />
        </div> 

        <div v-else class="flex flex-col gap-10 h-full">

          <div class="flex gap-6 h-fit">
            <!-- Student Header Card -->
            <StudentHeaderCard
              :student="student"
              @send-email="handleSendEmail"
              @send-slack-message="handleSendSlackMessage"
            />

            <!-- Stats Cards -->
            <StudentStats :student="student" />
          </div>

        
          <!-- Season Progress -->
          <SeasonProgressTable :season-progress="seasonProgress" />
        </div>
    </template>
  </UDashboardPanel>
</template>
