<script setup>
definePageMeta({
    layout: "custom",
    middleware: ["auth", "student-only"],
});

const supabase = useSupabaseClient();
const runtimeConfig = useRuntimeConfig();

// Google Calendar integration
const googleAccessToken = ref(null);
const calendarEvents = ref([]);

// Current date tracking
const currentDate = ref(new Date());

// Computed properties
const currentMonth = computed(() => currentDate.value.getMonth());
const currentYear = computed(() => currentDate.value.getFullYear());

const monthName = computed(() => {
    return currentDate.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
});

// Day names (starting with Monday)
const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Get first day of the month (0 = Monday, 6 = Sunday)
const firstDayOfMonth = computed(() => {
    const day = new Date(currentYear.value, currentMonth.value, 1).getDay();
    // Convert from Sunday=0 to Monday=0 format
    return (day + 6) % 7;
});

// Get number of days in current month
const daysInMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
});

// Get number of days in previous month
const daysInPreviousMonth = computed(() => {
    return new Date(currentYear.value, currentMonth.value, 0).getDate();
});

// Generate calendar days array
const calendarDays = computed(() => {
    const days = [];

    // Add previous month's trailing days
    const prevMonthDays = firstDayOfMonth.value;
    for (let i = prevMonthDays - 1; i >= 0; i--) {
        days.push({
            day: daysInPreviousMonth.value - i,
            isCurrentMonth: false,
            isPrevMonth: true,
            isNextMonth: false,
            date: new Date(currentYear.value, currentMonth.value - 1, daysInPreviousMonth.value - i)
        });
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth.value; i++) {
        days.push({
            day: i,
            isCurrentMonth: true,
            isPrevMonth: false,
            isNextMonth: false,
            date: new Date(currentYear.value, currentMonth.value, i)
        });
    }

    // Add next month's leading days to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
        days.push({
            day: i,
            isCurrentMonth: false,
            isPrevMonth: false,
            isNextMonth: true,
            date: new Date(currentYear.value, currentMonth.value + 1, i)
        });
    }

    return days;
});

// Check if a date is today
const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

// Check if a date is a weekend
const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
};

// Navigation functions
const previousMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1);
};

const nextMonth = () => {
    currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1);
};

const goToToday = () => {
    currentDate.value = new Date();
};

// Fetch calendar events from Google Calendar API
async function fetchCalendarEvents(accessToken) {
    try {
        console.log("Fetching calendar events with token: ", accessToken);
        // Get the first and last day of the current month
        const timeMin = new Date(currentYear.value, currentMonth.value, 1).toISOString();
        const timeMax = new Date(currentYear.value, currentMonth.value + 1, 0, 23, 59, 59).toISOString();

        console.log("Time range:", timeMin, "to", timeMax);

        const res = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
                timeMin
            )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!res.ok) {
            console.error("Failed to fetch calendar events. Status:", res.status);
            if (res.status === 401) {
                // Token expired, try to refresh
                console.log("Token expired, attempting to refresh...");
                const newToken = await refreshGoogleToken();
                if (newToken) {
                    return await fetchCalendarEvents(newToken);
                }
            }
            throw new Error(`Failed to fetch calendar events: ${res.status}`);
        }

        const data = await res.json();
        console.log("Fetched calendar events:", data);
        console.log("Number of events:", data.items?.length || 0);
        calendarEvents.value = data.items || [];

        // Log events for debugging
        if (calendarEvents.value.length > 0) {
            console.log("Sample event:", calendarEvents.value[0]);
        }
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        calendarEvents.value = [];
    }
}

// Refresh Google token when expired
async function refreshGoogleToken() {
    const storedRefreshToken = window.localStorage.getItem("oauth_provider_refresh_token");

    if (!storedRefreshToken) {
        console.error("No refresh token available");
        return null;
    }

    try {
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

        if (!response.ok) {
            throw new Error("Failed to refresh token");
        }

        const dataGoogle = await response.json();
        googleAccessToken.value = dataGoogle.access_token;
        console.log("New access token: ", googleAccessToken.value);
        return dataGoogle.access_token;
    } catch (error) {
        console.error("Error refreshing token:", error);
        return null;
    }
}

// Get events for a specific date
const getEventsForDate = (date) => {
    const events = calendarEvents.value.filter(event => {
        if (!event.start) return false;

        const eventStart = event.start.dateTime ? new Date(event.start.dateTime) : new Date(event.start.date);
        const isSameDate = eventStart.toDateString() === date.toDateString();

        return isSameDate;
    });

    return events;
};

// Initialize and fetch calendar data
onMounted(async () => {
    console.log("Component mounted, fetching session...");
    const {
        data: { session },
    } = await supabase.auth.getSession();
    googleAccessToken.value = session?.provider_token || null;

    console.log("Google access token:", googleAccessToken.value ? "Found" : "Not found");

    if (googleAccessToken.value) {
        await fetchCalendarEvents(googleAccessToken.value);
    } else {
        console.warn("No Google access token available. User may not be authenticated with Google.");
    }
});

// Watch for token changes and re-fetch events
watch(googleAccessToken, async (newToken) => {
    if (newToken) {
        await fetchCalendarEvents(newToken);
    }
});

// Re-fetch events when month changes
watch([currentMonth, currentYear], async () => {
    if (googleAccessToken.value) {
        await fetchCalendarEvents(googleAccessToken.value);
    }
});
</script>

<template>
  <UDashboardPanel id="calendarNuxtUI">
      <template #header>
          <UDashboardNavbar title="Calendar" >
              <template #leading>
                  <UDashboardSidebarCollapse />
              </template>
          </UDashboardNavbar>
      </template>

      <template #body>    
          <!-- Calendar Header with Navigation -->
          <div class="flex items-center justify-center mx-6 relative">
            <UFieldGroup size="xl" class="absolute left-0">
                <UButton
                @click="previousMonth"
                color="neutral"
                variant="outline"
                icon="i-lucide:chevron-left"
                class="text-muted"
            />

              <UButton
                @click="goToToday"
                color="neutral"
                variant="outline"
                class="text-muted"
              >
                Today
              </UButton>

              <UButton
                @click="nextMonth"
                color="neutral"
                variant="outline"
                icon="i-lucide:chevron-right"
                class="text-muted"
              />
            </UFieldGroup>
            <h2 class="text-2xl font-semibold">{{ monthName }}</h2>
          </div>

          <!-- Calendar Grid -->
          <UCard
            class="h-full ring-0"
            :ui="{
                body: 'p-4',
                header: 'grid grid-cols-7 !gap-0 !pb-0 !px-0 mx-5.5',
                body: ' !pt-0'
            }"
          >
            <!-- Day Names Header -->
             <template #header>
                  <div
                    v-for="dayName in dayNames"
                    :key="dayName"
                    class="text-center text-sm text-muted py-2 bg-muted border border-muted font-medium first:rounded-tl-md last:rounded-tr-md not-first:border-l-0 border-b-0"
                  >
                    {{ dayName }}
                  </div>
             </template>
           
            <!-- Calendar Days Grid -->
            <div class="grid grid-cols-7 gap-0">
              <UCard
                v-for="(dayInfo, index) in calendarDays"
                :key="index"
                :class="[
                  'rounded-none relative overflow-hidden',
                  {
                    '': isToday(dayInfo.date),
                    'bg-muted border border-muted/20': !dayInfo.isCurrentMonth,
                  }
                ]"
                :ui="{
                  body: '!p-2 flex flex-col items-center justify-start gap-2 min-h-[115px]'
                }"
              >
                <!-- Weekend diagonal stripes background -->
                <svg
                  v-if="isWeekend(dayInfo.date) && dayInfo.isCurrentMonth"
                  class="absolute inset-0 w-full h-full pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                    <pattern
                      id="doodad"
                      width="16"
                      height="16"
                      viewBox="0 0 40 40"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(135)"
                    >
                      <rect width="100%" height="100%" class="fill-gray-50 dark:fill-[#18181b]" />
                      <path d="M-10 30h60v1h-60zM-10-10h60v1h-60" class="fill-gray-200 dark:fill-gray-600" />
                      <path d="M-10 10h60v1h-60zM-10-30h60v1h-60z" class="fill-gray-200 dark:fill-gray-600" />
                    </pattern>
                  </defs>
                  <rect fill="url(#doodad)" height="100%" width="100%" />
                </svg>

                <span
                  :class="[
                    'text-sm mr-auto w-6 h-6 flex justify-center items-center rounded-full z-10 relative',
                    {
                      'text-primary-600 font-bold bg-primary-200': isToday(dayInfo.date),
                      'text-gray-400': !dayInfo.isCurrentMonth,
                      'text-muted': dayInfo.isCurrentMonth && !isToday(dayInfo.date),
                    }
                  ]"
                >
                  {{ dayInfo.day }}
                </span>

                <!-- Calendar Events for this day -->
                <div v-if="dayInfo.isCurrentMonth" class="w-full space-y-1 z-10 relative">
                  <a
                    v-for="event in getEventsForDate(dayInfo.date)"
                    :key="event.id"
                    :href="event.location || event.hangoutLink || '#'"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 border-l border-primary-600 truncate block hover:bg-primary-200 transition-colors cursor-pointer"
                    :title="event.summary + (event.location ? '\n' + event.location : '')"
                  >
                    {{ event.summary }}
                  </a>
                </div>
              </UCard>
            </div>
          </UCard>
      </template>
  </UDashboardPanel>
</template>