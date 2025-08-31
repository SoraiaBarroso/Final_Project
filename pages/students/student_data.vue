<script setup>
import { UIcon } from '#components';
import StatCard from '~/components/students/StatCard.vue';
import DeadlinesCard from '~/components/students/DeadlinesCard.vue';

definePageMeta({
  layout: 'custom',
  middleware: ["auth"]
});

const calendarEvents = ref([]);
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

function getTimeRange(period = 'week') {
  let timeMin = new Date();
  let timeMax = new Date();

  if (period === 'week') {
    // Set to Monday of current week (start of week)
    timeMin.setDate(timeMin.getDate() - timeMin.getDay() + 1);
    timeMin.setHours(0, 0, 0, 0);
    
    // Set to Monday of next week (end of current week)
    timeMax.setDate(timeMax.getDate() - timeMax.getDay() + 8);
    timeMax.setHours(0, 0, 0, 0);
    
  } else if (period === 'month') {
    // Set to beginning of current month
    timeMin.setDate(1);
    timeMin.setHours(0, 0, 0, 0);
    
    // Set to beginning of next month
    timeMax.setMonth(timeMax.getMonth() + 1, 1);
    timeMax.setHours(0, 0, 0, 0);
  } else if (period === 'day') {
    timeMin.setHours(0, 0, 0, 0);
    timeMax.setHours(23, 59, 59, 999);
  }

  return {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
  };
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

function formatEventTime(dateTimeString) {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

// function groupEventsByDay(events) {
//   const grouped = {};
  
//   events.forEach(event => {
//     const dateTime = event.start?.dateTime || event.originalStartTime?.dateTime;
//     const dayKey = formatEventDate(dateTime);
    
//     if (!grouped[dayKey]) {
//       grouped[dayKey] = [];
//     }
    
//     grouped[dayKey].push(event);
//   });
  
//   return grouped;
// }

// ...existing code...

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

  console.log("Fetched student data:", studentData.value);
}

// TODO DISPLAY EVENTS THIS WEEK
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

const googleAccessToken = ref(1)

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
      await fetchCalendarEvents(googleAccessToken.value)
    } catch (error) {
      console.error('Failed to refresh Google token', error)
    }
  }
}, { immediate: true })

const deadline = new Date(Date.now() + 10 * 60 * 60 * 1000); // 10 hours from now
const now = ref(new Date());
const totalSeconds = Math.floor((deadline - new Date()) / 1000);

const countdown = ref(totalSeconds);

const hours = computed(() => Math.floor(countdown.value / 3600));
const minutes = computed(() => Math.floor((countdown.value % 3600) / 60));
const seconds = computed(() => countdown.value % 60);

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
  <div class="student_data flex background justify-between">
    
    <div class="flex flex-col xl:pl-10 xl:pr-0 2xl:px-6 px-8 2xl:w-1/2 xl:w-[45%] w-[45%] pt-6">
      
      <div class="flex mb-4 justify-start items-center gap-3">
        <h1 class="xl:text-4xl 2xl:text-3xl text-black/80 font-semibold">Hello, </h1>
        <span class="xl:text-4xl font-semibold 2xl:text-3xl text-black/80">{{ studentData.first_name }}! <UIcon name="emojione:camel" class="w-8 h-8 ml-1"/></span>
      </div>

      <p class="text-muted text-base 2xl:text-lg xl:mt-2 2xl:mt-1">Nice to have you back, what an exciting day!</p>
      <p class="text-muted text-base 2xl:text-lg 2xl:mb-2">Get ready and check your projects today</p>

      <div class="flex justify-between items-center 2xl:mt-6">
        <h2 class="text-black/80 font-semibold 2xl:text-xl">Today's meetings</h2>
        <nuxtLink to="/students/calendar" class="text-[#0D47A1] flex items-center gap-3 event_card">
          View all meetings
           <svg id="arrow" class="fill-[#0D47A1]" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
              <path d="m1.649 8.514-.91-.915 5.514-5.523H2.027l.01-1.258h6.388v6.394H7.158l.01-4.226z"></path>
            </svg>
        </nuxtLink>
      </div>

      <div class="mt-4 flex justify-center">
        <UCard 
          v-if="calendarEvents.length > 0"
          v-for="event in calendarEvents" 
          :key="event.id" 
          class="event_card mb-3 hover:border-blue-500 cursor-pointer transition-colors duration-200"
          variant="outline"
          :ui="{
            body: 'xl:!px-4 xl:!py-4 flex items-center justify-between'
          }"
        >
          <template #default>
            <a
              :href="event.location"
              target="_blank"
              rel="noopener noreferrer"
              class="pr-4 gap-4 flex items-center justify-between w-full h-full no-underline"
              style="color: inherit;"
            >
              <!-- <div class="h-12 w-1 rounded-full bg-blue-400"></div> -->
              <div class="w-full">
                <div class="font-medium text-gray-800 xl:text-base 2xl:text-base">{{ event.summary }}</div>
                <div class="xl:text-sm 2xl:text-sm text-muted mt-2">
                  {{ formatEventTime(event.start?.dateTime || event.originalStartTime?.dateTime) }}
                </div>
              </div>
              <div>
                <svg id="arrow" class="fill-blue-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 12 12">
                  <path d="m1.649 8.514-.91-.915 5.514-5.523H2.027l.01-1.258h6.388v6.394H7.158l.01-4.226z"></path>
                </svg>
              </div>
            </a>
          </template>
        </UCard>
        <UCard
          v-else
          variant="outline"
          class="flex justify-center items-center w-full mt-2"
          :ui="{
            body: 'w-full flex flex-col items-center justify-center gap-4'
          }"
        >
          <div class="text-gray-500 text-center flex flex-col justify-center items-center">
            <div class="bg-elevated/60 p-3 rounded-full flex justify-center items-center mb-4">
              <UIcon name="emojione:tear-off-calendar" class="w-9 h-9 text-muted" />
            </div>
            <p>No events scheduled for today</p>
            <p>Great time to keep working on your projects</p>
          </div>
        </UCard>
      </div>

      <div class="flex justify-between items-center 2xl:mt-8">
        <h2 class="text-black/80 font-semibold 2xl:text-xl">Upcoming deadlines</h2>
        <nuxtLink to="/test" class="text-[#0D47A1] flex items-center gap-3 event_card">
          View Timeline
           <svg id="arrow" class="fill-[#0D47A1]" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
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

    <div class="2xl:w-1/2 xl:w-[55%] w-[55%] flex flex-col gap-2 items-center pt-6 px-4">
      <UCard
        variant="outline"
        :ui="{
          root: 'w-full rounded-lg xl:px-6 2xl:px-4',
          body: 'w-full flex flex-col items-center justify-center gap-12'
        }"
      >
        <!-- Header -->
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

        <div class="grid grid-cols-2 grid-rows-2 w-full 2xl:gap-8 gap-4">
          
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
            :value="formatLastLogin(studentData.last_login)"
            label="Last Login"
            icon="emojione:alien-monster"
          />

          <StatCard
            :value="studentData.points ?? 0"
            label="Qwasar Points"
            icon="emojione:trophy"
          />
          
        </div>

        <div class="flex flex-col items-center justify-center w-full">
          <div class="flex justify-between items-center w-full mb-4">
            <p class="2xl:text-2xl xl:text-xl font-bold text-black/80">Overall Progress</p>
            <p class="text-muted">{{ studentData.progress }}%</p>
          </div>

          <UProgress color="info" v-model="studentData.progress" />
        </div>
      </UCard>

      <UCard
        class="mt-6 w-full flex flex-col flex-1 min-h-0"
        variant="outline"
        :ui="{
          root: 'w-full h-full flex-1 min-h-0 overflow-y-auto rounded-lg xl:px-6 2xl:px-2',
          body: 'w-full flex flex-col items-center justify-center gap-6 h-full'
        }"
      >
        <div class="flex justify-between items-center w-full">
          <div class="flex justify-center items-center gap-4">
            <div class="bg-gradient-to-r from-purple-500 to-pink-400 w-10 h-10 rounded-lg flex justify-center items-center">
              <UIcon name="i-lucide:sparkles" class="w-6 h-6 text-white" />
            </div>
            <h2 class="2xl:text-2xl xl:text-xl font-bold text-black/80">Daily Tips</h2>
          </div>
          <UIcon name="i-lucide:refresh-cw" class="w-5 h-5 text-purple-500 cursor-pointer" @click="pickRandomTip" />
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
}

.events:hover {
  scrollbar-width: 6px;
  scrollbar-color: #c2c2c2a2 transparent;
}

</style>