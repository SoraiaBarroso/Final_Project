<script setup>
import { resolveComponent } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: ['admin']
})

const route = useRoute()
const supabase = useSupabaseClient()

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
  <UDashboardPanel id="student-detail"
    :ui="{body: 'overflow-auto'}"
  >
    <template #header>
      <UDashboardNavbar title="Students Details">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
        <!-- Loading Skeletons -->
        <div v-if="loading" class="space-y-6">
          <!-- Header and Stats Section Skeleton -->
          <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            <!-- Student Header Card Skeleton -->
            <div class="lg:col-span-4 xl:col-span-1">
              <UPageCard>
                <div class="flex flex-col items-center space-y-4 p-4">
                  <USkeleton class="h-24 w-24 rounded-full" />
                  <USkeleton class="h-6 w-32" />
                  <USkeleton class="h-4 w-40" />
                  <div class="w-full space-y-2">
                    <USkeleton class="h-10 w-full" />
                    <USkeleton class="h-10 w-full" />
                  </div>
                </div>
              </UPageCard>
            </div>

            <!-- Stats Cards Skeleton -->
            <div class="lg:col-span-4 xl:col-span-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 h-full">
                <UPageCard v-for="i in 6" :key="i">
                  <div class="space-y-3 p-4">
                    <div class="flex items-center gap-3">
                      <USkeleton class="h-10 w-10 rounded-full" />
                      <USkeleton class="h-4 w-24" />
                    </div>
                    <USkeleton class="h-8 w-16" />
                  </div>
                </UPageCard>
              </div>
            </div>
          </div>

          <!-- Season Progress Table Skeleton -->
          <UPageCard>
            <div class="space-y-4 p-4">
              <USkeleton class="h-6 w-48" />
              <div class="space-y-3">
                <USkeleton v-for="i in 5" :key="i" class="h-16 w-full" />
              </div>
            </div>
          </UPageCard>
        </div>

        <!-- Actual Content -->
        <div v-else class="space-y-6">
          <!-- Header and Stats Section -->
          <div class="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-4 gap-6">
            <!-- Student Header Card - takes 1 column on large screens -->
            <div class="lg:col-span-4 xl:col-span-1">
              <AdminStudentDetailsStudentHeaderCard
                :student="student"
                @send-email="handleSendEmail"
                @send-slack-message="handleSendSlackMessage"
              />
            </div>

            <!-- Stats Cards - takes 3 columns on large screens -->
            <div class="lg:col-span-4 xl:col-span-3 h-full w-full">
              <AdminStudentDetailsStudentStats :student="student" />
            </div>
          </div>

          <!-- Season Progress -->
          <AdminStudentDetailsSeasonProgressTable :season-progress="seasonProgress" />
        </div>
    </template>
  </UDashboardPanel>
</template>
