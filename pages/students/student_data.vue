<script setup>
import { UIcon } from '#components';

definePageMeta({
  layout: 'custom',
  middleware: ["auth"]
});

const calendarEvents = ref([]);
const studentData = ref({});
const supabase = useSupabaseClient()

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

onMounted(async () => {
  // This page is for displaying student data
  console.log("Student data page loaded");
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.provider_token;
  console.log("Access token:", accessToken);
  await fetchCalendarEvents(accessToken)
  await fetchStudentData();
});

const value = ref(80)
</script>

<template>
  <div class="student_data flex h-screen background">
    
    <div class="flex flex-col px-10 w-[40%] h-full pt-8 xl:pb-3 2xl:pb-10">
      
      <div class="flex mb-4 justify-start items-center gap-3">
         <h1 class="xl:text-4xl 2xl:text-6xl text-black/80 font-semibold">Hello, </h1>
          <span class="xl:text-3xl font-semibold 2xl:text-6xl text-black/80">{{ studentData.first_name }} 👋</span>
          <!-- <UIcon
            name="fluent-emoji:hand-with-fingers-splayed-medium-light"
            size="40"
          ></UIcon> -->
      </div>

      <p class="text-muted text-base 2xl:text-2xl 2xl:mt-8">Nice to have you back, what an exciting day!</p>
      <p class="text-muted xl:pt-1 2xl:pt-2 text-base 2xl:text-2xl 2xl:mb-2">Get ready and check the calendar for this week</p>

      <UCard
          variant=""
          :ui="{
            root: 'events h-full overflow-y-auto rounded-lg',
          }"
          class="mt-6"
        >
        <div v-if="calendarEvents.length > 0">
          <div 
            v-for="(dayEvents, dayName) in groupEventsByDay(calendarEvents)" 
            :key="dayName"
            class="mb-1"
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
                  <div class="h-12 w-1 rounded-full bg-blue-400"></div>
                  <div class="w-full">
                    <div class="font-medium text-gray-800 2xl:text-base">{{ event.summary }}</div>
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
        </div>
        <div v-else class="text-gray-500 text-center py-8">
          No events scheduled for this week
        </div>
      </UCard>

    </div>

    <div class="w-[60%] flex justify-center items-center pt-8 pb-3 2xl:pb-6 px-8">
      <UCard
        variant="outline"
        :ui="{
          root: 'h-full w-full overflow-y-auto rounded-lg flex flex-col items-center justify-center',
        }"
      >
        <!-- Header -->
        <div class="flex flex-col items-center text-center">
          <img class="rounded-full 2xl:w-24 2xl:h-24" :src="studentData.profile_image_url" alt="user profile">
          <p class="2xl:mt-4 font-semibold text-black/90">{{ studentData.program_name }}</p>
          <p class="text-muted">Cohort {{ studentData.cohort_name }}</p>
        </div>

        <div class="grid grid-cols-2 grid-rows-2 gap-6 w-full mt-8">
          <UCard class="flex flex-col items-center justify-center p-6">
            <div class="text-2xl font-bold text-blue-600">Card 1</div>
            <div class="text-gray-500 mt-2">Description for card 1</div>
          </UCard>
          <UCard class="flex flex-col items-center justify-center p-6">
            <div class="text-2xl font-bold text-blue-600">Card 2</div>
            <div class="text-gray-500 mt-2">Description for card 2</div>
          </UCard>
          <UCard class="flex flex-col items-center justify-center p-6">
            <div class="text-2xl font-bold text-blue-600">Card 3</div>
            <div class="text-gray-500 mt-2">Description for card 3</div>
          </UCard>
          <UCard class="flex flex-col items-center justify-center p-6">
            <div class="text-2xl font-bold text-blue-600">Card 4</div>
            <div class="text-gray-500 mt-2">Description for card 4</div>
          </UCard>
        </div>

        <div class="flex flex-col items-center justify-center">
          <div class="flex justify-between items-center w-full">
            <p class="text-2xl font-bold text-blue-600">Progress</p>
            <p class="text-gray-500 mt-2">80%</p>
          </div>

          <UProgress color="info" v-model="value" />
        </div>
      </UCard>
    </div>
  </div>
</template>

<style>
/* .background {
  background-size: 40px 40px;
  background-image:
    linear-gradient(to right, rgba(218, 218, 218, 0.279) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(203, 203, 203, 0.267) 1px, transparent 1px);
} */

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