<script setup>
  import MeetingsDisplay from "~/components/student_dashboard/MeetingsDisplay.vue";
  import DeadlinesCard from "~/components/students/DeadlinesCard.vue";
  import StatCard from "~/components/students/StatCard.vue";

  definePageMeta({
    layout: "custom",
    middleware: ["auth", "student-only"],
  });

  const studentData = ref({});
  const supabase = useSupabaseClient();
  const runtimeConfig = useRuntimeConfig();
  const calendarEvents = ref([]);

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

  watch(tipsRead, (newVal) => {
    if (newVal >= 5) {
      // Trigger confetti animation
      useConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      tipsRead.value = 0;
    }
  });

  const launchConfetti = () => {
    useConfetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

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
  <div class="student_data flex flex-col h-full gap-6 2xl:gap-8 px-8 py-6">
    
    <div class="w-full">
       <div class="flex flex-col">
        <div class="mb-4 flex items-center justify-start gap-3">
          <h1 class="font-semibold text-black/80 xl:text-4xl 2xl:text-2xl">Hello,</h1>
          <span class="text-primary-500 font-semibold xl:text-4xl 2xl:text-2xl"
            >{{ studentData.first_name }}! 
          </span>
        </div>

        <div>
          <p class="text-muted text-base xl:mt-2 2xl:mt-1 2xl:text-lg">
            Nice to have you back, what an exciting day!
          </p>
          <p class="text-muted mt-2 text-base 2xl:text-lg">
            Get ready and check your projects today
          </p>
        </div>
      </div>
    </div>


    <div class="w-full flex flex-col lg:flex-row h-full gap-8 lg:gap-12">
      
      <div class="flex flex-col justify-around h-full gap-4 2xl:gap-2 w-full lg:w-1/2">
        <MeetingsDisplay v-if="googleAccessToken" :googleAccessToken="googleAccessToken" />

        <DeadlinesCard
          v-if="studentData"
          :seasonId="studentData.expected_season_id"
          :programId="studentData.program_id"
          :cohortId="studentData.cohort_id"
        />
      </div>

      
      <div class="flex w-full lg:w-1/2 flex-col h-full justify-around items-center gap-6">
        
        <div class="flex flex-col w-full gap-4">
            <h2 class="font-semibold text-black/80 2xl:text-xl">
              Progress
            </h2>
            <p v-if="studentData.status == 'On Track'" class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">Congratulations! You're currently <span class="text-green-500 font-semibold cursor-pointer" @click="launchConfetti">on track</span></p>
            <p v-else-if="studentData.status == 'At Risk'" class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">You're currently <span class="text-yellow-500">at risk</span>, please check your tasks</p>
            <p v-else class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-lg">You're currently <span class="text-red-500 text-semi">off track</span>, please reach out for help</p>
            <UCard
              class="mt-4 w-full"
              :ui="{
                body: '2xl:!px-6 2xl:!py-4 xl:!px-6 w-full flex flex-col items-end gap-4',
              }"
            >
              <p class="text-muted ">{{ studentData.progress }}%</p>
              <UProgress size="lg" v-model="value" />
              <p class="text-muted">{{ completedSeasons }} out of {{ totalSeasons }} completed</p>
            </UCard>
        </div>

        <div class="grid w-full grid-cols-2 grid-rows-2 gap-4 2xl:gap-4">
        <StatCard
          :value="`${completedSeasons} / ${totalSeasons}`"
          label="Seasons"
          icon="i-lucide:brain"
          :percentage="`${((completedSeasons / totalSeasons) * 100).toFixed(0)}%`"
        />

        <StatCard
          :value="studentData.completed_projects"
          label="Projects"
          icon="i-lucide:computer"
        />

        <StatCard
          :value="studentData.exercises_completed"
          label="Exercises"
          icon="i-lucide:clipboard-check"
        />

        <StatCard
          :value="studentData.points ?? 0"
          label="Qwasar Points"
          icon="i-lucide:trophy"
          :tooltip="true"
        />
        </div>
      </div>

    </div>
  </div>
</template>

<style>
#arrow {
  transition: transform 0.2s ease;
}

.event_card:hover #arrow {
  transform: translate(4px, -4px);
}

.student_data {
  font-family: "Space Grotesk", sans-serif;
  overflow-x: hidden;
}

html,
body,
#__nuxt {
  overflow-x: hidden !important;
}

.events[ref="meetingsScroll"] {
  max-width: 100%;
  box-sizing: border-box;
}

.events:hover {
  scrollbar-width: 6px;
  scrollbar-color: #c2c2c2a2 transparent;
}
</style>
