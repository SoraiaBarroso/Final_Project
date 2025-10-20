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
    'Behind': 'error',
    'Ahead': 'info',
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
      <div v-if="loading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-info" />
      </div>

      <div v-else-if="error" class="flex flex-col items-center justify-center h-64 gap-4">
        <UIcon name="i-lucide-alert-circle" class="size-12 text-error" />
        <p class="text-error">Error loading student: {{ error }}</p>
        <UButton @click="goBack" color="neutral">Back to Dashboard</UButton>
      </div>

      <div v-else-if="student" class="space-y-6">
        <!-- Student Header Card -->
        <StudentHeaderCard
          :student="student"
          @send-email="handleSendEmail"
          @send-slack-message="handleSendSlackMessage"
        />

        <!-- Stats Cards -->
        <StudentStats :student="student" />
      
        <!-- Attendance Details -->
        <!-- <UCard variant="subtle">
          <template #header>
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-calendar-check" class="size-5" />
              Attendance Details
            </h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="p-4 border border-default rounded-lg">
              <p class="text-muted text-sm mb-1">Standup Meetings</p>
              <p class="text-xl font-bold">{{ student.standup_attended || 0 }}</p>
            </div>
            <div class="p-4 border border-default rounded-lg">
              <p class="text-muted text-sm mb-1">Workshops</p>
              <p class="text-xl font-bold">{{ student.workshops_attended || 0 }}</p>
            </div>
            <div class="p-4 border border-default rounded-lg">
              <p class="text-muted text-sm mb-1">Mentoring Sessions</p>
              <p class="text-xl font-bold">{{ student.mentoring_attended || 0 }}</p>
            </div>
          </div>
        </UCard> -->

        <!-- Season Progress -->
        <SeasonProgressTable :season-progress="seasonProgress" />

        <!-- Project Completions -->
        <!-- <UCard variant="subtle" v-if="projectCompletions.length > 0">
          <template #header>
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-folder-check" class="size-5" />
              Project Completions
            </h3>
          </template>
          <div class="space-y-3">
            <div
              v-for="completion in projectCompletions"
              :key="completion.id"
              class="p-4 border border-default rounded-lg"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="font-medium">{{ completion.projects?.name }}</p>
                    <UBadge
                      :color="completion.is_completed ? 'success' : 'warning'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ completion.is_completed ? 'Completed' : 'In Progress' }}
                    </UBadge>
                  </div>
                  <p class="text-muted text-sm mb-2">
                    {{ completion.projects?.description }}
                  </p>
                  <div class="flex items-center gap-4 text-sm">
                    <span v-if="completion.grade" class="text-muted">
                      Grade: <span class="font-medium">{{ completion.grade }}</span>
                    </span>
                    <span v-if="completion.completion_date" class="text-muted">
                      Completed: {{ new Date(completion.completion_date).toLocaleDateString() }}
                    </span>
                  </div>
                  <p v-if="completion.feedback" class="text-sm mt-2 p-2 bg-elevated rounded">
                    {{ completion.feedback }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard> -->

        <!-- Additional Info -->
        <UCard variant="subtle">
          <template #header>
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <UIcon name="i-lucide-info" class="size-5" />
              Additional Information
            </h3>
          </template>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-muted text-sm">Student ID</p>
              <p class="font-mono text-sm">{{ student.id }}</p>
            </div>
            <div>
              <p class="text-muted text-sm">Last Login</p>
              <p class="text-sm">
                {{ formatDateTime(student.last_login) || 'Never' }}
              </p>
            </div>
            <div>
              <p class="text-muted text-sm">Created At</p>
              <p class="text-sm">{{ new Date(student.created_at).toLocaleDateString() }}</p>
            </div>
            <div>
              <p class="text-muted text-sm">Last Updated</p>
              <p class="text-sm">{{ new Date(student.updated_at).toLocaleDateString() }}</p>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
