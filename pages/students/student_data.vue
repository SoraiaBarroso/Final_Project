<script setup>
import { UIcon } from '#components';

definePageMeta({
  layout: 'custom',
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
  
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('email', session?.user?.email)
    .single();

  if (error) {
    console.error("Error fetching student data:", error);
    return;
  }

  studentData.value = data || {};
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
  console.log("Current calendar events:", calendarEvents.value);
}

onMounted(async () => {
  // This page is for displaying student data
  console.log("Student data page loaded");
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.provider_token;
  await fetchCalendarEvents(accessToken)
  await fetchStudentData();
});
</script>

<template>
  <div class="flex h-screen">
    
    <div class="flex flex-col px-10 w-[40%] h-full pt-6 pb-3">
      
      <div class="flex mb-4 justify-start items-center gap-3">
         <h1 class="text-4xl text-gray-800 font-semibold">Hello, </h1>
          <span class="text-3xl text-gray-800 pt-1">{{ studentData.first_name }}</span>
          <UIcon
            name="fluent-emoji:hand-with-fingers-splayed-medium-light"
            size="40"
          ></UIcon>
      </div>

      <p class="text-gray-500">Nice to have you back, what an exciting day!</p>
      <p class="text-gray-500 pt-1">Get ready and check the calendar for this week</p>
    
      <UCard
          variant="outline"
          :ui="{
            root: 'h-full overflow-y-auto rounded-lg',
          }"
          class="mt-6"
        >
        <div v-if="calendarEvents.length > 0">
          <div 
            v-for="(dayEvents, dayName) in groupEventsByDay(calendarEvents)" 
            :key="dayName"
            class="mb-6"
          >
            <h3 class="text-lg font-semibold text-info ml-0.5 mb-3">{{ dayName }}</h3>
            
            <UCard 
              v-for="event in dayEvents" 
              :key="event.id" 
              class="mb-3"
              variant="outline"
              :ui="{
                body: 'xl:!px-4 xl:!py-4'
              }"
            >
              <div class="font-medium text-gray-900">{{ event.summary }}</div>
              <div class="text-sm text-gray-500 mt-2">
                {{ formatEventTime(event.start?.dateTime || event.originalStartTime?.dateTime) }}
              </div>
            </UCard>
          </div>
        </div>
        <div v-else class="text-gray-500 text-center py-8">
          No events scheduled for this week
        </div>
      </UCard>

    </div>

    <div class="w-[60%] flex justify-center items-center">
      <p>something else</p>
    </div>
  </div>
</template>