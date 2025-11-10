<script setup>
definePageMeta({
    layout: "custom",
    middleware: ["auth", "student-only"],
});

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
                body: 'p-4'
            }"
          >
            <!-- Day Names Header -->
            <div class="grid grid-cols-7 gap-0">
              <div
                v-for="dayName in dayNames"
                :key="dayName"
                class="text-center text-sm text-muted py-2 bg-muted border border-muted font-medium first:rounded-tl-md last:rounded-tr-md not-first:border-l-0 border-b-0"
              >
                {{ dayName }}
              </div>
            </div>

            <!-- Calendar Days Grid -->
            <div class="grid grid-cols-7 gap-0">
              <UCard
                v-for="(dayInfo, index) in calendarDays"
                :key="index"
                :class="[
                  'rounded-none relative overflow-hidden',
                  {
                    '': isToday(dayInfo.date),
                    'bg-muted': !dayInfo.isCurrentMonth,
                  }
                ]"
                :ui="{
                  body: '!p-2 flex items-center justify-center min-h-[110px]'
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
                      <rect width="100%" height="100%" fill="rgba(255, 255, 255,1)" />
                      <path d="M-10 30h60v1h-60zM-10-10h60v1h-60" fill="rgba(203, 213, 224,1)" />
                      <path d="M-10 10h60v1h-60zM-10-30h60v1h-60z" fill="rgba(203, 213, 224,1)" />
                    </pattern>
                  </defs>
                  <rect fill="url(#doodad)" height="100%" width="100%" />
                </svg>

                <span
                  :class="[
                    'text-sm mr-auto mb-auto w-8 h-8 flex justify-center items-center rounded-full z-10 relative',
                    {
                      'text-primary-600 font-bold bg-primary-200': isToday(dayInfo.date),
                      'text-gray-400': !dayInfo.isCurrentMonth,
                      'text-muted': dayInfo.isCurrentMonth && !isToday(dayInfo.date),
                    }
                  ]"
                >
                  {{ dayInfo.day }}
                </span>
              </UCard>
            </div>
          </UCard>
      </template>
  </UDashboardPanel>
</template>