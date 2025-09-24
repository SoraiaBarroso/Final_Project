<script setup>
  import { UIcon } from "#components";
  import MeetingsDisplay from "~/components/student_dashboard/MeetingsDisplay.vue";
  import DeadlinesCard from "~/components/students/DeadlinesCard.vue";
  import StatCard from "~/components/students/StatCard.vue";
  import BarChart from "~/components/students/BarChart.vue";

  definePageMeta({
    layout: "custom",
    middleware: ["auth"],
  });

  const studentData = ref({});
  const supabase = useSupabaseClient();
  const runtimeConfig = useRuntimeConfig();
  const colorChip = computed(() =>
    studentData.value.status
      ? { "On Track": "success", "At Risk": "warning", Behind: "error", Unknown: "neutral" }[
          studentData.value.status
        ]
      : "neutral"
  );

  // Motivational tips/quotes for students
  const motivationTips = [
    "Break large assignments into smaller tasks to avoid feeling overwhelmed.",
    "Write pseudocode before jumping into actual coding — it saves time.",
    "Review your class notes within 24 hours to reinforce memory.",
    "Practice coding by hand occasionally; it strengthens problem-solving skills.",
    "Use version control (like Git) early — it’s a must-have skill for developers.",
    "Don’t just copy solutions; re-implement them from scratch to truly learn.",
    "Test your code often; small tests prevent big headaches later.",
    "Set a timer for focused study sessions (Pomodoro technique works well).",
    "Balance theory with practice — apply concepts by building mini-projects.",
    "Read error messages carefully; they often tell you exactly what’s wrong.",
    "Collaborate with classmates — teaching a concept helps you master it.",
    "Learn how to read documentation; it’s your best friend in the long run.",
    "Stay organized with folders, naming conventions, and comments.",
    "Focus on mastering fundamentals (data structures, algorithms, OOP).",
    "Don’t procrastinate debugging; fix issues as soon as they appear.",
    "Keep a 'bug journal' — write down common mistakes and how you solved them.",
    "Ask for help when stuck, but try solving on your own first.",
    "Take breaks and step away from the screen to clear your mind.",
    "Keep practicing regularly; consistency beats cramming.",
    "Remember: progress is better than perfection — just keep coding!",
  ];

  const currentTip = ref("");
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
  const googleAccessToken = ref(1);
  // Store all seasons for the student's program for id-to-name mapping
  const allProgramSeasons = ref([]);

  function pickRandomTip() {
    const idx = Math.floor(Math.random() * motivationTips.length);
    currentTip.value = motivationTips[idx];
    tipsRead.value++;
  }

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

  function formatEventDate(dateTimeString) {
    const date = new Date(dateTimeString);
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = monthNames[date.getMonth()];

    return `${dayName} ${day} ${month}`;
  }

  async function fetchProjectsCompleted(studentId) {
    const { count, error } = await supabase
      .from("student_project_completion")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId)
      .eq("is_completed", true);

    return count || 0;
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
      .select("season_id, is_completed")
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

  const deadline = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours from now
  const now = ref(new Date());
  const totalSeconds = Math.floor((deadline - new Date()) / 1000);

  const countdown = ref(totalSeconds);

  onMounted(() => {
    const interval = setInterval(() => {
      now.value = new Date();
      const left = Math.floor((deadline - now.value) / 1000);
      countdown.value = left > 0 ? left : 0;
    }, 1000);
    onUnmounted(() => clearInterval(interval));
  });

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
    pickRandomTip();
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
</script>

<template>
  <div class="student_data flex h-full gap-8 px-8 py-6">
    <div class="flex flex-col justify-between w-1/2">
      <div class="flex flex-col">
        <div class="mb-4 flex items-center justify-start gap-3">
          <h1 class="font-semibold text-black/80 xl:text-4xl 2xl:text-3xl">Hello,</h1>
          <span class="text-primary-500 font-semibold xl:text-4xl 2xl:text-3xl"
            >{{ studentData.first_name }}! 
          </span>
        </div>

        <div>
          <p class="text-muted text-base xl:mt-2 2xl:mt-2 2xl:text-xl">
            Nice to have you back, what an exciting day!
          </p>
          <p class="text-muted mt-2 text-base 2xl:text-xl">
            Get ready and check your projects today
          </p>
        </div>
      </div>

      <MeetingsDisplay v-if="googleAccessToken" :googleAccessToken="googleAccessToken" />

      <DeadlinesCard
        v-if="studentData"
        :seasonId="studentData.expected_season_id"
        :programId="studentData.program_id"
        :cohortId="studentData.cohort_id"
      />
    </div>

    <div class="flex w-1/2 flex-col justify-between items-center gap-6">

      <UCard
        class="w-full"
        :ui="{
          body: 'w-full 2xl:!px-3 2xl:!py-4 flex flex-col gap-4',
        }"
      >
            <div class="flex w-full items-center justify-between text-center px-2">
          <div class="flex items-center">
            <UAvatar
              :src="studentData.profile_image_url"
              icon="i-lucide-image"
              class="2xl:h-13 2xl:w-13"
            />
            <div class="text-left 2xl:ml-4">
              <p class="font-semibold text-black/90 2xl:text-xl">{{ studentData.program_name }}</p>
              <p class="text-muted xl:text-base 2xl:text-lg">
                Cohort {{ studentData.cohort_name }}
              </p>
            </div>
          </div>

          <UBadge :color="colorChip" variant="subtle" size="xl" class="rounded-full">{{
            studentData.status
          }}</UBadge>
        </div>
    </UCard>

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

      <UCard
        variant="soft"
        class="w-full"
        :ui="{
          root: 'rounded-lg border-1 border-gray-200',
          body: 'w-full bg-primary-50 2xl:!px-6 2xl:!py-4',
        }"
      >
        <BarChart class="w-full" v-if="studentData" :cohortId="studentData.cohort_id" :userId="studentData.id" />
      </UCard>
      
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
