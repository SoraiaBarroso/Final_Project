<script setup>
import { UIcon } from '#components';
import StatCard from '~/components/students/StatCard.vue';

definePageMeta({
  layout: 'custom',
  middleware: ["auth"]
});

const calendarEvents = ref([]);
const studentData = ref({});
const supabase = useSupabaseClient()
const runtimeConfig = useRuntimeConfig();
const colorChip = computed(() => studentData.value.status ? { 'On Track': 'success', 'At Risk': 'warning', 'Behind': 'error', 'Unknown': 'neutral' }[studentData.value.status] : 'neutral')

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
  const now = new Date();
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

function groupEventsByDay(events) {
  const grouped = {};
  
  events.forEach(event => {
    const dateTime = event.start?.dateTime || event.originalStartTime?.dateTime;
    const dayKey = formatEventDate(dateTime);
    
    if (!grouped[dayKey]) {
      grouped[dayKey] = [];
    }
    
    grouped[dayKey].push(event);
  });
  
  return grouped;
}

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
async function fetchCalendarEvents(accessToken, period = 'week') {
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

onMounted(async () => {
  const { data: { session } } = await supabase.auth.getSession()
  googleAccessToken.value = session?.provider_token || null

  // const { data: { session: newSession } } = await supabase.auth.refreshSession()
  // console.log("Refreshed session:", newSession)
  
  if (googleAccessToken.value) {
    await fetchCalendarEvents(googleAccessToken.value)
  }

  await fetchStudentData()
})

const value = ref(80)
</script>

<template>
  <div class="student_data flex h-screen background justify-between">
    
    <div class="flex flex-col xl:pl-10 xl:pr-0 2xl:px-10 2xl:w-[40%] xl:w-[45%] h-full pt-8 xl:pb-3 2xl:pb-10">
      
      <div class="flex mb-4 justify-start items-center gap-3">
        <h1 class="xl:text-4xl 2xl:text-6xl text-black/80 font-semibold">Hello, </h1>
        <span class="xl:text-4xl font-semibold 2xl:text-6xl text-black/80">{{ studentData.first_name }} 👋</span>
      </div>

      <p class="text-muted text-base 2xl:text-2xl xl:mt-2 2xl:mt-8">Nice to have you back, what an exciting day!</p>
      <p class="text-muted xl:pt-2 2xl:pt-2 text-base 2xl:text-2xl 2xl:mb-2">Get ready and check the calendar for this week</p>

      <UCard
          variant=""
          :ui="{
            root: 'events h-full overflow-y-auto rounded-lg relative p-0',
            body: 'p-0'
          }"
          class="2xl:mt-6 xl:mt-4 "
        >
          <div 
            v-for="(dayEvents, dayName) in groupEventsByDay(calendarEvents)" 
            :key="dayName"
            class="mb-8 last-of-type:mb-0"
            v-if="calendarEvents.length > 0"
          >
            <h3 class="xl:text-lg 2xl:text-xl font-semibold text-black/90 ml-0.5 mb-3">{{ dayName }}</h3>
            
            <UCard 
              v-for="event in dayEvents" 
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

          </div>
        <div v-else class="text-gray-500 text-center py-8">
          No events scheduled for this week
        </div>
      </UCard>

    </div>

    <div class="2xl:w-[60%] xl:w-[55%] flex justify-center items-center pt-8 pb-6 2xl:pb-6 xl:px-6 2xl:px-8">
      <UCard
        variant="outline"
        :ui="{
          root: 'h-full w-full overflow-y-auto rounded-lg xl:px-6 2xl:px-14',
          body: 'h-full w-full flex flex-col items-center justify-center gap-14'
        }"
      >
        <!-- Header -->
        <div class="flex 2xl:flex-col xl:flex-row items-center justify-between w-full text-center">
          
          <div class="flex items-center 2xl:flex-col xl:flex-row">
            <UAvatar size="3xl" :src="studentData.profile_image_url" icon="i-lucide-image" class="2xl:h-24 2xl:w-24 xl:h-14 xl:w-14"/>
            <div class="xl:text-left 2xl:text-center xl:ml-6">
              <p class="2xl:mt-4 2xl:text-xl xl:text-lg font-semibold text-black/90">{{ studentData.program_name }}</p>
              <p class="text-muted 2xl:text-lg xl:text-base">Cohort {{ studentData.cohort_name }}</p>
            </div>
          </div>

          <UBadge :color="colorChip" variant="subtle" size="xl">On Track</UBadge>
        </div>

        <div class="grid grid-cols-2 grid-rows-2 xl:gap-6 2xl:gap-12 xl:h-[55%] 2xl:h-[50%] w-full">
          
          <StatCard
            :value="studentData.completed_projects"
            label="Projects Completed"
            icon="fluent-emoji:desktop-computer"
          />
          
          <StatCard
            :value="studentData.exercises_completed"
            label="Exercises Completed"
            icon="fluent-emoji:paperclip"
          />

          <StatCard
            :value="studentData.last_login ? new Date(studentData.last_login).toLocaleDateString() : 'N/A'"
            label="Last Logged"
            icon="fluent-emoji:alarm-clock"
          />

          <StatCard
            :value="studentData.points"
            label="Qwasar Points"
            icon="fluent-emoji:trophy"
          />
          
        </div>

        <div class="flex flex-col items-center justify-center w-full">
          <div class="flex justify-between items-center w-full mb-4">
            <p class="2xl:text-2xl xl:text-xl font-bold text-black/80">Overall Progress</p>
            <p class="text-muted mt-2">{{ studentData.progress }}%</p>
          </div>

          <UProgress color="success" v-model="studentData.progress" />
        </div>
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