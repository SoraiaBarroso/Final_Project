<script setup>
definePageMeta({
  layout: 'custom',
});

import { ScheduleXCalendar } from '@schedule-x/vue';
import {
  createCalendar,
  createViewDay,
  createViewMonthAgenda,
  createViewMonthGrid,
  createViewWeek,
} from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';

const supabase = useSupabaseClient()
const XL_BREAKPOINT = 1280; // Define your breakpoint
const gridHeight = ref(500);

function handleResize() {
  if (window.innerWidth < XL_BREAKPOINT) {
    gridHeight.value = 400; // Adjust gridHeight for smaller screens
    console.log('Grid height set to:', gridHeight.value);
  } else {
    gridHeight.value = 620; // Default gridHeight for larger screens
    console.log('Grid height set to:', gridHeight.value);
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

const config = {
  calendars: {
    meetings: {
      colorName: 'meetings',
      lightColors: {
        main: 'rgba(28, 125, 249, 0.5)', // Transparent blue for meetings
        container: 'rgba(210, 231, 255, 0.3)', // Lighter transparent blue
        onContainer: '#002859',
      },
      darkColors: {
        main: 'rgba(192, 223, 255, 0.5)', // Transparent dark blue
        onContainer: '#dee6ff',
        container: 'rgba(66, 106, 162, 0.3)', // Lighter transparent dark blue
      },
    },
    deadlines: {
      colorName: 'deadlines',
      lightColors: {
        main: 'rgba(212, 68, 237, 0.5)', // Transparent orange for deadlines
        container: 'rgba(212, 68, 237, 0.15)', // Lighter transparent orange
        onContainer: '#002859',
      },
      darkColors: {
        main: 'rgba(255, 245, 192, 0.5)', // Transparent dark orange
        onContainer: '#fff5de',
        container: 'rgba(162, 151, 66, 0.3)', // Lighter transparent dark orange
      },
    },
  },
  dayBoundaries: {
    start: '11:00',
    end: '21:00',
  },
  minDate: new Date().toISOString().slice(0, 10),
  maxDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().slice(0, 10),
  weekOptions: {
    gridHeight: gridHeight.value,
    eventOverlap: false,
  },
  monthGridOptions: {
    nEventsPerDay: 4,
  },
  callbacks: {
    onEventClick: (event) => {
      console.log('Event clicked:', event);
      if (event.location) {
        window.open(event.location, '_blank'); // Open the Google Calendar event in a new tab
      } else {
        console.error('No link available for this event.');
      }
    },
  },
  views: [
    createViewDay(),
    createViewWeek(),
    createViewMonthGrid(),
    createViewMonthAgenda(),
  ],
};

let calendarApp;
const calendarEvents = ref([]);

function getTimeRange(period = '3-months') {
  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.setMonth(now.getMonth() + 3)).toISOString();
  return { timeMin, timeMax };
}

function formatEventTime(dateTimeString) {
  const date = new Date(dateTimeString);
  const formattedDate = date.toISOString().slice(0, 10); // Extract YYYY-MM-DD
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }); // Extract HH:mm
  return `${formattedDate} ${formattedTime}`; // Combine date and time
}

async function fetchCalendarEvents(accessToken) {
  const { timeMin, timeMax } = getTimeRange();

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

  // Add events to the calendar
  calendarEvents.value.forEach((event) => {
    const startTime = new Date(event.start?.dateTime || event.start.date);
    const endTime = event.end?.dateTime || event.end?.date
      ? new Date(event.end.dateTime || event.end.date)
      : new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour to start time if end time is missing

    calendarApp.events.add({
      id: event.id,
      title: event.summary || 'No Title',
      start: formatEventTime(startTime.toISOString()),
      end: formatEventTime(endTime.toISOString()),
      location: event.location || '',
      calendarId: 'meetings', // Assign a calendar ID
    });
  });
}

onMounted(async () => {
    handleResize();
  
    window.addEventListener('resize', handleResize);
    // Initialize the calendar only after the DOM is fully loaded
    calendarApp = createCalendar(config);
    
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.provider_token;

    if (accessToken) {
        await fetchCalendarEvents(accessToken);
    }
});
</script>

<template>
  <div id="calendar-wrapper" class="px-8 flex justify-center items-center h-full">
    <!-- Ensure the calendar is rendered only on the client side -->
    <ClientOnly>
      <ScheduleXCalendar :calendar-app="calendarApp" />
    </ClientOnly>
  </div>
</template>

<style scoped>
.sx-vue-calendar-wrapper {
  width: 100%;
  height: 90%;
}

.sx__time-grid-event-inner {
    cursor: pointer;
}

:deep(.sx__calendar) {
  border: none !important;
}
</style>