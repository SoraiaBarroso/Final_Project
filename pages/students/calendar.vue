<script setup>
  import {
    createCalendar,
    createViewDay,
    createViewMonthAgenda,
    createViewMonthGrid,
    createViewWeek,
  } from "@schedule-x/calendar";
  import { ScheduleXCalendar } from "@schedule-x/vue";

  import "@schedule-x/theme-default/dist/index.css";

  definePageMeta({
    layout: "custom",
  });

  const supabase = useSupabaseClient();
  const XL_BREAKPOINT = 1280; // Define your breakpoint
  const gridHeight = ref(500);

  function handleResize() {
    if (window.innerWidth < XL_BREAKPOINT) {
      gridHeight.value = 400; // Adjust gridHeight for smaller screens
      console.log("Grid height set to:", gridHeight.value);
    } else {
      gridHeight.value = 620; // Default gridHeight for larger screens
      console.log("Grid height set to:", gridHeight.value);
    }
  }

  onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
  });

  const config = {
    calendars: {
      meetings: {
        colorName: "meetings",
        lightColors: {
          main: "rgba(28, 125, 249, 0.5)", // Transparent blue for meetings
          container: "rgba(210, 231, 255, 0.3)", // Lighter transparent blue
          onContainer: "#002859",
        },
        darkColors: {
          main: "rgba(192, 223, 255, 0.5)", // Transparent dark blue
          onContainer: "#dee6ff",
          container: "rgba(66, 106, 162, 0.3)", // Lighter transparent dark blue
        },
      },
      deadlines: {
        colorName: "deadlines",
        lightColors: {
          main: "rgba(212, 68, 237, 0.5)", // Transparent orange for deadlines
          container: "rgba(212, 68, 237, 0.15)", // Lighter transparent orange
          onContainer: "#002859",
        },
        darkColors: {
          main: "rgba(255, 245, 192, 0.5)", // Transparent dark orange
          onContainer: "#fff5de",
          container: "rgba(162, 151, 66, 0.3)", // Lighter transparent dark orange
        },
      },
    },
    dayBoundaries: {
      start: "11:00",
      end: "21:00",
    },
    minDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
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
        console.log("Event clicked:", event);
        if (event.location) {
          window.open(event.location, "_blank"); // Open the Google Calendar event in a new tab
        } else {
          console.error("No link available for this event.");
        }
      },
    },
    views: [createViewDay(), createViewWeek(), createViewMonthGrid(), createViewMonthAgenda()],
  };

  let calendarApp;
  const calendarEvents = ref([]);

  function getTimeRange(period = "3-months") {
    const now = new Date();
    // Start from the first day of the current month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const timeMin = firstDayOfMonth.toISOString();
    const timeMax = new Date(now.setMonth(now.getMonth() + 3)).toISOString();
    return { timeMin, timeMax };
  }

  function formatEventTime(dateTimeString) {
    const date = new Date(dateTimeString);
    const formattedDate = date.toISOString().slice(0, 10); // Extract YYYY-MM-DD
    const formattedTime = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }); // Extract HH:mm
    return `${formattedDate} ${formattedTime}`; // Combine date and time
  }

  async function fetchCalendarEvents(accessToken) {
    const { timeMin, timeMax } = getTimeRange();

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

    const data = await res.json();
    calendarEvents.value = data.items || [];
    console.log("Current calendar events:", calendarEvents.value);

    // Add events to the calendar
    calendarEvents.value.forEach((event) => {
      const startTime = new Date(event.start?.dateTime || event.start.date);
      const endTime =
        event.end?.dateTime || event.end?.date
          ? new Date(event.end.dateTime || event.end.date)
          : new Date(startTime.getTime() + 60 * 60 * 1000); // Add 1 hour to start time if end time is missing

      console.log("Adding event:", startTime, endTime, event);
      calendarApp.events.add({
        id: event.id,
        title: event.summary || "No Title",
        start: formatEventTime(startTime.toISOString()),
        end: formatEventTime(endTime.toISOString()),
        location: event.location || "",
        calendarId: "meetings", // Assign a calendar ID
      });
    });
  }

  const googleAccessToken = ref(1);
  const runtimeConfig = useRuntimeConfig();

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
          await fetchCalendarEvents(googleAccessToken.value);
        } catch (error) {
          console.error("Failed to refresh Google token", error);
        }
      }
    },
    { immediate: true }
  );

  onMounted(async () => {
    handleResize();

    window.addEventListener("resize", handleResize);
    // Initialize the calendar only after the DOM is fully loaded
    calendarApp = createCalendar(config);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    googleAccessToken.value = session?.provider_token || null;

    if (googleAccessToken.value) {
      await fetchCalendarEvents(googleAccessToken.value);
    }
  });
</script>

<template>
  <div id="calendar-wrapper" class="flex h-full items-center justify-center px-8">
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

  :deep(.sx__month-grid-week) {
    border-top: 1px solid var(--ui-border);
  }

  :deep(.sx__month-grid-day:not(:last-child)) {
    border-inline-end: 1px solid var(--ui-border);
  }

  :deep(.sx__time-grid-event-time, .sx__time-grid-event-people, .sx__time-grid-event-location) {
    margin-top: 1px;
  }

  :deep(.sx__view-selection-selected-item) {
    border: 1px solid var(--ui-border);
    padding: 8px 16px;
    border-radius: 8px;
    color: var(--ui-text);
    font-weight: 500;
    margin-right: 10px;
  }

  :deep(.sx__calendar-header .sx__date-input) {
    border: 1px solid var(--ui-border);
    padding: 10px 16px;
    border-radius: 8px;
    color: var(--ui-text);
    font-weight: 500;
  }

  :deep(.sx__date-picker__day.sx__date-picker__day--today.sx__date-picker__day--selected) {
    background-color: rgb(59 130 246);
    color: white;
  }

  :deep(.sx__date-picker__day.sx__date-picker__day--today) {
    background-color: rgb(59 130 246);
    color: white;
  }

  :deep(.sx__date-picker__day-name) {
    color: var(--ui-text-muted);
    font-weight: 500;
  }

  :deep(.sx__calendar-header .sx__date-input:focus) {
    border-color: rgb(59 130 246);
  }

  :deep(.sx__date-input--active .sx__date-input-label) {
    color: rgb(59 130 246);
  }

  :deep(
    .sx__calendar-wrapper button,
    .sx__date-picker-wrapper button,
    .sx__date-picker-popup button
  ) {
    color: var(--ui-text);
    font-weight: 500;
    overflow: hidden;
  }

  :deep(.sx__calendar-wrapper button:hover) {
    background-color: var(--ui-bg-elevated);
  }

  :deep(.sx__calendar-wrapper button:focus) {
    background-color: var(--ui-bg-elevated);
    outline: none;
  }

  :deep(.sx__date-picker__month-view-header__month-year) {
    background: none !important;
  }

  :deep(.sx__calendar-header .sx__date-picker-popup) {
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid var(--ui-border);
  }
  :deep(.sx__range-heading) {
    color: var(--ui-text);
    font-weight: 500;
  }
  :deep(.sx__today-button) {
    border: 1px solid var(--ui-border);
    padding: 8px 16px;
    border-radius: 8px;
    color: var(--ui-text);
    font-weight: 500;
  }

  :deep(.sx__calendar) {
    border: none !important;
  }

  :deep(.sx__time-grid-day) {
    border-left: 1px solid var(--ui-border) !important;
  }

  :deep(.sx__week-grid__hour) {
    border-top: 1px solid var(--ui-border) !important;
  }

  :deep(.sx__week-grid__date--is-today .sx__week-grid__day-name) {
    color: rgb(59 130 246);
  }

  :deep(.sx__week-grid__day-name) {
    color: var(--ui-text-gray-400);
  }

  :deep(.sx__date-input-wrapper) {
    display: none;
  }

  :deep(.sx__month-grid-day__header-date.sx__is-today) {
    background-color: rgb(59 130 246);
    color: white;
  }

  :deep(.sx__week-grid__date--is-today .sx__week-grid__date-number) {
    background-color: rgb(59 130 246);
    color: white;
  }

  :deep(.sx__week-grid__date-number) {
    color: var(--ui-text);
  }

  :deep(.sx__calendar-wrapper ul li:hover) {
    background-color: rgba(59, 130, 246, 0.6);
    font-weight: 500;
    color: white;
  }

  :deep(.sx__calendar-wrapper ul li) {
    color: var(--ui-text);
    font-weight: 500;
  }

  :deep(.sx__calendar-wrapper ul li:first-of-type) {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  :deep(.sx__calendar-wrapper ul li:last-of-type) {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  :deep(.sx__calendar-wrapper ul) {
    border-radius: 8px;
    border: 1px solid var(--ui-border);
    box-shadow: none;
  }

  :deep(.sx__view-selection-item.is-selected) {
    background-color: var(--ui-bg-elevated);
  }
</style>
