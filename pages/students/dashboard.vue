<script setup>
  definePageMeta({
    layout: "custom",
    middleware: ["auth", "student-only"],
  });

  const studentData = ref({});
  const supabase = useSupabaseClient();
  const runtimeConfig = useRuntimeConfig();
  const calendarEvents = ref([]);
  const toast = useToast();
  const tipsRead = ref(0);

  const totalSeasons = ref(0);
  // Helper: filtered and deduplicated seasons for progress count
  const filteredSeasons = computed(() => {
    if (!Array.isArray(allProgramSeasons.value)) return [];
    // Exclude 'Final Project' and 'Onboarding'
    let filtered = allProgramSeasons.value.filter(
      (s) => s.name !== "Final Project" && s.name !== "Onboarding"
    );
    // Deduplicate Season 03 (any specialization)
    const seen = new Set();
    filtered = filtered.filter((s) => {
      // Match 'Season 03 Software Engineer ...'
      const match = s.name.match(/^Season 03 Software Engineer( .+)?$/);
      if (match) {
        if (seen.has("Season 03")) return false;
        seen.add("Season 03");
        return true;
      }
      return true;
    });
    return filtered;
  });

  const completedSeasons = ref(0);
  const googleAccessToken = ref(null);
  // Store all seasons for the student's program for id-to-name mapping
  const allProgramSeasons = ref([]);
  // Store season progress data for display
  const seasonProgressData = ref([]);

  // Get current season name
  const currentSeasonName = computed(() => {
    if (!studentData.value.current_season_id || !allProgramSeasons.value.length) return 'N/A';
    const season = allProgramSeasons.value.find(s => s.id === studentData.value.current_season_id);
    return season?.name || 'N/A';
  });

  // Get expected season name
  const expectedSeasonName = computed(() => {
    if (!studentData.value.expected_season_id || !allProgramSeasons.value.length) return 'N/A';
    const season = allProgramSeasons.value.find(s => s.id === studentData.value.expected_season_id);
    return season?.name || 'N/A';
  });

  watch(tipsRead, (newVal) => {
    if (newVal >= 5) {
      // Trigger confetti animation
      useConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      tipsRead.value = 0;
    }
  });

  async function fetchOverallProgress(studentId) {
    const { data, error } = await supabase
      .from("student_season_progress")
      .select("progress_percentage")
      .eq("student_id", studentId);

    if (error || !data || data.length === 0) {
      return 0;
    }

    // Calculate the average progress
    const total = data.reduce((sum, row) => sum + parseFloat(row.progress_percentage), 0);
    const avg = total / data.length;
    return Math.round(avg); // or keep as float if you want decimals
  }

  async function fetchSeasonProgress(studentId) {
    const { data, error } = await supabase
      .from("student_season_progress")
      .select(`
        season_id,
        progress_percentage,
        is_completed,
        seasons!inner(id, name)
      `)
      .eq("student_id", studentId);

    if (error || !data || data.length === 0) {
      console.error("Error fetching season progress:", error);
      return [];
    }

    // Transform the data for the Progress component
    return data.map(item => ({
      season_id: item.season_id,
      season_name: item.seasons?.name || 'Unknown Season',
      progress_percentage: Math.round(parseFloat(item.progress_percentage)),
      is_completed: item.is_completed
    }));
  }

  async function fetchProjectsCompleted(studentId) {
    const { count, error } = await supabase
      .from("student_project_completion")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("is_completed", true);

    return count || 0;
  }

  
  async function fetchCalendarEvents(accessToken, period = 'today') {
    const { timeMin, timeMax } = getTimeRange(period);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
        timeMin
      )}&timeMax=${encodeURIComponent(
        timeMax
      )}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!res.ok) {
      toast.error("Failed to fetch calendar events");
      console.error("Failed to fetch calendar events:", res.statusText);
      return;
    }
    const data = await res.json();
    calendarEvents.value = data.items || [];
    console.log("Current calendar home:", calendarEvents.value);
  }

  function getTimeRange(period = "week") {
    let timeMin = new Date();
    let timeMax = new Date();

    if (period === "week") {
      // Set to Monday of current week (start of week)
      timeMin.setDate(timeMin.getDate() - timeMin.getDay() + 1);
      timeMin.setHours(0, 0, 0, 0);

      // Set to Monday of next week (end of current week)
      timeMax.setDate(timeMax.getDate() - timeMax.getDay() + 8);
      timeMax.setHours(0, 0, 0, 0);
    } else if (period === "month") {
      // Set to beginning of current month
      timeMin.setDate(1);
      timeMin.setHours(0, 0, 0, 0);

      // Set to beginning of next month
      timeMax.setMonth(timeMax.getMonth() + 1, 1);
      timeMax.setHours(0, 0, 0, 0);
    } else if (period === "today") {
      timeMin.setHours(0, 0, 0, 0);
      timeMax.setHours(23, 59, 59, 999);
    }

    return {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
    };
  }
  
  async function fetchStudentData() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Fetch student data with program and cohort info using foreign key relationships
    const { data, error } = await supabase
      .from("students")
      .select(
        `
      *,
      programs:program_id ( name ),
      cohorts:cohort_id ( name )
    `
      )
      .eq("email", session?.user?.email)
      .single();

    if (error) {
      console.error("Error fetching student data:", error);
      return;
    }

    // Flatten the result for easier access in template
    studentData.value = {
      ...data,
      program_name: data.programs?.name,
      cohort_name: data.cohorts?.name,
    };

    studentData.value.completed_projects = await fetchProjectsCompleted(studentData.value.id);
    studentData.value.progress = await fetchOverallProgress(studentData.value.id);

    // Fetch season progress data for the Progress component
    seasonProgressData.value = await fetchSeasonProgress(studentData.value.id);

    // Fetch all seasons for the student's program (for id-to-name mapping)
    const { data: programSeasons, error: programSeasonsError } = await supabase
      .from("seasons")
      .select("id, name, program_id")
      .eq("program_id", studentData.value.program_id);
    if (programSeasons) {
      allProgramSeasons.value = programSeasons;
      console.log("All program seasons:", programSeasons);
      // Set totalSeasons to filtered count
      totalSeasons.value = filteredSeasons.value.length;
    } else {
      console.error("Error fetching program seasons:", programSeasonsError);
    }

    console.log("fetched seasons for program:", allProgramSeasons.value);
    // Fetch all seasons for the student's cohort and program
    const { data: seasonsData, error: seasonsError } = await supabase
      .from("program_cohort_seasons")
      .select("id, start_date, end_date")
      .eq("cohort_id", studentData.value.cohort_id)
      .eq("program_id", studentData.value.program_id);

    console.log("Fetched seasons:", seasonsData, seasonsError);
    // totalSeasons.value is now set from filteredSeasons

    // Fetch completed seasons for the student
    const { data: completedData, error: completedError } = await supabase
      .from("student_season_progress")
      .select("season_id, seasons(name), is_completed")
      .eq("student_id", studentData.value.id)
      .eq("is_completed", true);

    console.log("Fetched completed seasons:", completedData);
    completedSeasons.value = Array.isArray(completedData) ? completedData.length : 0;

    console.log("Fetched student data:", studentData.value);
  }

  async function refreshGoogleToken() {
    const storedRefreshToken = window.localStorage.getItem("oauth_provider_refresh_token");

    const response = await fetch("https://www.googleapis.com/oauth2/v3/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: runtimeConfig.public.googleClientId,
        client_secret: runtimeConfig.public.googleClientSecret,
        refresh_token: storedRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    const dataGoogle = await response.json();
    googleAccessToken.value = dataGoogle.access_token;
    console.log("New access token: ", googleAccessToken.value);
    return dataGoogle.access_token;
  }

  // Watch the token, refresh if undefined
  watch(
    googleAccessToken,
    async (newToken) => {
      if (!newToken) {
        console.log("Access token is undefined, refreshing...");
        try {
          await refreshGoogleToken();
          // await fetchCalendarEvents(googleAccessToken.value)
        } catch (error) {
          console.error("Failed to refresh Google token", error);
        }
      }
    },
    { immediate: true }
  );

  onMounted(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    googleAccessToken.value = session?.provider_token || null;
    // const { data: { session: newSession } } = await supabase.auth.refreshSession()
    // console.log("Refreshed session:", newSession)

    if (googleAccessToken.value) {
      console.log("Fetching calendar events with token:", googleAccessToken.value);
      await fetchCalendarEvents(googleAccessToken.value);
    }

    await fetchStudentData();
  });

  // Format last_login as 'x days/hours/minutes ago'
  function formatLastLogin(dateString) {
    if (!dateString) return "N/A";
    const now = new Date();
    const last = new Date(dateString);
    const diffMs = now - last;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay > 0) return diffDay === 1 ? "1 d ago" : `${diffDay}d ago`;
    if (diffHour > 0) return diffHour === 1 ? "1 h ago" : `${diffHour}h ago`;
    if (diffMin > 0) return diffMin === 1 ? "1 min ago" : `${diffMin}min ago`;
    return "just now";
  }

  const value = computed(() => studentData.value.progress || 0);

</script>

<template>
    <UDashboardPanel id="home">
      <template #header>
          <UDashboardNavbar title="Dashboard" >
              <template #leading>
                  <UDashboardSidebarCollapse />
              </template>

              <template #right>
                <UIcon name="i-game-icons:crown" class="text-primary-500 size-8 mr-1" />
                {{ studentData.points_assigned ?? 0 }} pts

              </template>
          </UDashboardNavbar>
      </template>

      <template #body>
        <div class="w-full justify-between items-center flex">
          <StudentDashboardGreetings v-if="studentData.first_name" :first_name="studentData.first_name" />

          <div class="flex gap-8 translate-y-6">
                
                <StudentDashboardStatCard
                  :value="'On Track'"
                  label="Status"
                  icon="i-lucide:computer"
                />

               <StudentDashboardStatCard
                  :value="'10h'"
                  label="Activity Platform"
                  icon="i-lucide:clipboard-check"
                />

                <StudentDashboardStatCard
                  :value="'1 day ago'"
                  label="Last Login Platform"
                  icon="i-lucide:computer"
                />

                 <StudentDashboardStatCard
                  :value="'90'"
                  label="Earned Points"
                  icon="i-lucide:computer"
                />

          </div>              
        </div>

        <UPageGrid class="h-full grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 mt-14 gap-10">
          <div class="flex flex-col gap-6">            
            <StudentDashboardMeetingsDisplay v-if="googleAccessToken" :googleAccessToken="googleAccessToken" />

            <StudentDashboardDeadlinesCard
              v-if="studentData"
              :seasonId="studentData.expected_season_id"
              :programId="studentData.program_id"
              :cohortId="studentData.cohort_id"
            />
          </div>
           
           <div class="flex flex-col gap-6">
              <StudentDashboardProgress
                v-if="studentData"
                :status="studentData.status"
                :progress="studentData.progress"
                :completedSeasons="completedSeasons"
                :totalSeasons="totalSeasons"
                :seasons="seasonProgressData"
              />

              <UPageGrid class="grid-cols-2 lg:grid-cols-2 gap-6">
                
                <StudentDashboardStatCard
                    :value="currentSeasonName"
                    label="Current Season"
                    icon="i-lucide:clipboard-check"
                />
                
                <StudentDashboardStatCard
                  :value="expectedSeasonName"
                  label="Expected Season"
                  icon="i-lucide:clipboard-check"
                />

                   <StudentDashboardStatCard
                  :value="studentData.exercises_completed"
                  label="Exercises"
                  icon="i-lucide:clipboard-check"
                />
                   <StudentDashboardStatCard
                  :value="studentData.completed_projects"
                  label="Projects"
                  icon="i-lucide:clipboard-check"
                />
                   <StudentDashboardStatCard
                  :value="studentData.points ?? 0"
                  label="Qwasar Points"
                  icon="i-lucide:clipboard-check"
                />
                   <StudentDashboardStatCard
                  :value="formatLastLogin(studentData.last_login)"
                  label="Last Login"
                  icon="i-lucide:clipboard-check"
                />
              </UPageGrid>
           </div>
        </UPageGrid>
      </template>
  </UDashboardPanel>
</template>
