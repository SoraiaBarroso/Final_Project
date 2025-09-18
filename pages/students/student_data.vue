<script setup>
import { UIcon } from '#components';
import StatCard from '~/components/students/StatCard.vue';
import DeadlinesCard from '~/components/students/DeadlinesCard.vue';
import MeetingsDisplay from '~/components/student_dashboard/MeetingsDisplay.vue';

definePageMeta({
  layout: 'custom',
  middleware: ["auth"]
});


const studentData = ref({});
const supabase = useSupabaseClient()
const runtimeConfig = useRuntimeConfig();
const colorChip = computed(() => studentData.value.status ? { 'On Track': 'success', 'At Risk': 'warning', 'Behind': 'error', 'Unknown': 'neutral' }[studentData.value.status] : 'neutral')

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
  "Remember: progress is better than perfection — just keep coding!"
];

const currentTip = ref("");
const tipsRead = ref(0)

const totalSeasons = ref(0)
// Helper: filtered and deduplicated seasons for progress count
const filteredSeasons = computed(() => {
  if (!Array.isArray(allProgramSeasons.value)) return [];
  // Exclude 'Final Project' and 'Onboarding'
  let filtered = allProgramSeasons.value.filter(s =>
    s.name !== 'Final Project' && s.name !== 'Onboarding'
  );
  // Deduplicate Season 03 (any specialization)
  const seen = new Set();
  filtered = filtered.filter(s => {
    // Match 'Season 03 Software Engineer ...'
    const match = s.name.match(/^Season 03 Software Engineer( .+)?$/);
    if (match) {
      if (seen.has('Season 03')) return false;
      seen.add('Season 03');
      return true;
    }
    return true;
  });
  return filtered;
});
const completedSeasons = ref(0)
const googleAccessToken = ref(1)
// Store all seasons for the student's program for id-to-name mapping
const allProgramSeasons = ref([])

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
}

async function fetchOverallProgress(studentId) {
  const { data, error } = await supabase
    .from('student_season_progress')
    .select('progress_percentage')
    .eq('student_id', studentId);

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
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  
  return `${dayName} ${day} ${month}`;
}

async function fetchProjectsCompleted(studentId) {
  const { count, error } = await supabase
    .from('student_project_completion')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('is_completed', true);

  return count || 0;
}

async function fetchStudentData() {
  const { data: { session } } = await supabase.auth.getSession();

  // Fetch student data with program and cohort info using foreign key relationships
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      programs:program_id ( name ),
      cohorts:cohort_id ( name )
    `)
    .eq('email', session?.user?.email)
    .single();

  if (error) {
    console.error("Error fetching student data:", error);
    return;
  }

  // Flatten the result for easier access in template
  studentData.value = {
    ...data,
    program_name: data.programs?.name,
    cohort_name: data.cohorts?.name
  };

  studentData.value.completed_projects = await fetchProjectsCompleted(studentData.value.id);
  studentData.value.progress = await fetchOverallProgress(studentData.value.id);

  // Fetch all seasons for the student's program (for id-to-name mapping)
  const { data: programSeasons, error: programSeasonsError } = await supabase
    .from('seasons')
    .select('id, name, program_id')
    .eq('program_id', studentData.value.program_id);
  if (programSeasons) {
    allProgramSeasons.value = programSeasons;
    console.log('All program seasons:', programSeasons);
    // Set totalSeasons to filtered count
    totalSeasons.value = filteredSeasons.value.length;
  } else {
    console.error('Error fetching program seasons:', programSeasonsError);
  }

  console.log("fetched seasons for program:", allProgramSeasons.value)
  // Fetch all seasons for the student's cohort and program
  const { data: seasonsData, error: seasonsError } = await supabase
    .from('program_cohort_seasons')
    .select('id, start_date, end_date')
    .eq('cohort_id', studentData.value.cohort_id)
    .eq('program_id', studentData.value.program_id)

  console.log("Fetched seasons:", seasonsData, seasonsError);
  // totalSeasons.value is now set from filteredSeasons

  // Fetch completed seasons for the student
  const { data: completedData, error: completedError } = await supabase
    .from('student_season_progress')
    .select('season_id, is_completed')
    .eq('student_id', studentData.value.id)
    .eq('is_completed', true)

  console.log("Fetched completed seasons:", completedData);
  completedSeasons.value = Array.isArray(completedData) ? completedData.length : 0;

  console.log("Fetched student data:", studentData.value);
}

async function refreshGoogleToken() {
  const storedRefreshToken = window.localStorage.getItem('oauth_provider_refresh_token')
  
  const response = await fetch('https://www.googleapis.com/oauth2/v3/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: runtimeConfig.public.googleClientId,
      client_secret: runtimeConfig.public.googleClientSecret,
      refresh_token: storedRefreshToken,
      grant_type: 'refresh_token',
    })
  })

  const dataGoogle = await response.json()
  googleAccessToken.value = dataGoogle.access_token
  console.log("New access token: ", googleAccessToken.value)
  return dataGoogle.access_token
}

// Watch the token, refresh if undefined
watch(googleAccessToken, async (newToken) => {
  if (!newToken) {
    console.log('Access token is undefined, refreshing...')
    try {
      await refreshGoogleToken()
      // await fetchCalendarEvents(googleAccessToken.value)
    } catch (error) {
      console.error('Failed to refresh Google token', error)
    }
  }
}, { immediate: true })

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
  const { data: { session } } = await supabase.auth.getSession()
  googleAccessToken.value = session?.provider_token || null

  // const { data: { session: newSession } } = await supabase.auth.refreshSession()
  // console.log("Refreshed session:", newSession)
  
  if (googleAccessToken.value) {
    await fetchCalendarEvents(googleAccessToken.value)
  }

  await fetchStudentData()
  pickRandomTip();
})

// Format last_login as 'x days/hours/minutes ago'
function formatLastLogin(dateString) {
  if (!dateString) return 'N/A';
  const now = new Date();
  const last = new Date(dateString);
  const diffMs = now - last;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay > 0) return diffDay === 1 ? '1 d ago' : `${diffDay}d ago`;
  if (diffHour > 0) return diffHour === 1 ? '1 h ago' : `${diffHour}h ago`;
  if (diffMin > 0) return diffMin === 1 ? '1 min ago' : `${diffMin}min ago`;
  return 'just now';
}
</script>

<template>
  <div class="student_data h-full flex gap-16 px-8 py-8">

  <div class="flex flex-col gap-4" style="width:50%; max-width:750px;">

    <div class="flex flex-col">
        <div class="flex mb-4 justify-start items-center gap-3">
          <h1 class="xl:text-4xl 2xl:text-3xl text-black/80 font-semibold">Hello, </h1>
          <span class="xl:text-4xl font-semibold 2xl:text-3xl text-primary-500">{{ studentData.first_name }}! <UIcon name="emojione:camel" size="32" class="ml-2"/></span>
        </div>

        <div>
          <p class="text-muted text-base 2xl:text-xl xl:mt-2 2xl:mt-2">Nice to have you back, what an exciting day!</p>
          <p class="text-muted text-base 2xl:text-xl mt-2">Get ready and check your projects today</p>
        </div>
    </div>

      <MeetingsDisplay
        v-if="googleAccessToken"
        :googleAccessToken="googleAccessToken"
      />

      <div class="flex justify-between items-center 2xl:mt-8">
        <h2 class="text-black/80 font-semibold 2xl:text-2xl">Upcoming deadlines</h2>
        <nuxtLink to="/test" class="text-muted flex items-center gap-3 event_card">
          View Timeline
           <svg id="arrow" class="fill-muted" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
              <path d="m1.649 8.514-.91-.915 5.514-5.523H2.027l.01-1.258h6.388v6.394H7.158l.01-4.226z"></path>
            </svg>
        </nuxtLink>
      </div> 
    
      <DeadlinesCard
        v-if="studentData"
        :seasonId="studentData.expected_season_id"
        :programId="studentData.program_id"
        :cohortId="studentData.cohort_id" 
      />
       
    </div>

    <div class="w-1/2 flex flex-col gap-6 items-center">
      <!-- Header -->
      <UCard
        variant="outline"
        :ui="{
          root: 'w-full rounded-lg xl:px-6 2xl:px-4',
          body: 'w-full flex items-center 2xl:!px-2 justify-between'
        }"
      >
        <div class="flex items-center justify-between w-full text-center">
          
          <div class="flex items-center">
            <UAvatar :src="studentData.profile_image_url" icon="i-lucide-image" class="2xl:w-14 2xl:h-14"/>
            <div class="text-left 2xl:ml-4">
              <p class="2xl:text-xl font-semibold text-black/90">{{ studentData.program_name }}</p>
              <p class="text-muted 2xl:text-lg xl:text-base">Cohort {{ studentData.cohort_name }}</p>
            </div>
          </div>

          <UBadge :color="colorChip" variant="subtle" size="xl" class="rounded-full">On Track</UBadge>
        </div>
      </UCard>

      <div class="grid grid-cols-2 grid-rows-2 w-full 2xl:gap-6 gap-4">
          
        <StatCard
          :value="studentData.completed_projects"
          label="Projects Completed"
          icon="emojione:books"
        />
        
        <StatCard
          :value="studentData.exercises_completed"
          label="Exercises Completed"
          icon="emojione:green-book"
        />

        <StatCard
          :value="`${completedSeasons} / ${totalSeasons}`"
          label="Seasons Completed"
          icon="emojione:alien-monster"
        />

        <StatCard
          :value="studentData.points ?? 0"
          label="Qwasar Points"
          icon="emojione:trophy"
        />
        
      </div>

      <!-- <UCard
        variant="outline"
        :ui="{
          root: 'w-full rounded-lg xl:px-6 2xl:px-4',
          body: 'w-full flex flex-col items-center justify-center 2xl:!px-2 gap-12'
        }"
      >
        <div class="flex flex-col items-center justify-center w-full">
          <div class="flex justify-between items-center w-full mb-4">
            <p class="2xl:text-2xl xl:text-xl font-bold text-black/80">Overall Progress</p>
            <p class="text-muted">{{ studentData.progress }}%</p>
          </div>

          <UProgress color="primary" v-model="studentData.progress" />

          <p class="text-muted ml-auto mt-2">
            {{ completedSeasons }} out of {{ totalSeasons }} seasons completed
          </p>
        </div>
      </UCard> -->

      <UCard
        class="mt-6 w-full flex flex-col"
        variant="outline"
        :ui="{
          root: 'w-full min-h-0 overflow-y-auto rounded-lg xl:px-6 2xl:px-2',
          body: 'w-full flex flex-col items-center justify-center 2xl:!px-4 gap-6 h-full'
        }"
      >
        <div class="flex justify-between items-center w-full">
          <div class="flex justify-center items-center gap-4">
            <div class="bg-gradient-to-r from-primary-500 to-primary-300 w-10 h-10 rounded-lg flex justify-center items-center">
              <UIcon name="i-lucide:sparkles" class="w-6 h-6 text-white" />
            </div>
            <h2 class="2xl:text-2xl xl:text-xl font-bold text-black/80">Daily Tips</h2>
          </div>
          <UIcon name="i-lucide:refresh-cw" class="w-5 h-5 text-primary-500 cursor-pointer" @click="pickRandomTip" />
        </div>
        <p class="text-muted text-left w-full">
          {{ currentTip }}
        </p>
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
  font-family: 'Space Grotesk', sans-serif;
  overflow-x: hidden;
}

html, body, #__nuxt {
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