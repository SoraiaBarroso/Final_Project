<script setup>
definePageMeta({
  layout: "default",
  middleware: ["admin"],
});

import { useAttendance } from '~/composables/useAttendance';
import { onMounted, ref, computed } from 'vue';

const { dataByCohort, error: attendanceError, loading: attendanceLoading, fetchAttendanceByCohort } = useAttendance();

// Search and filter states
const searchQuery = ref('');
const selectedSortOption = ref('name');

const sortOptions = [
  { label: 'Cohort Name', value: 'name' },
  { label: 'Student Count', value: 'students' },
  { label: 'Overall Attendance', value: 'overall' },
  { label: 'Workshop Attendance', value: 'workshop' },
];

onMounted(async () => {
  await fetchAttendanceByCohort();
  console.log('Cohort analytics data:', dataByCohort.value);
});

// Computed property for filtered and sorted cohorts
const filteredCohorts = computed(() => {
  if (!dataByCohort.value) return [];

  let cohorts = [...dataByCohort.value];

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    cohorts = cohorts.filter(c =>
      c.cohort_name?.toLowerCase().includes(query)
    );
  }

  // Sort based on selected option
  cohorts.sort((a, b) => {
    switch (selectedSortOption.value) {
      case 'name':
        return (a.cohort_name || '').localeCompare(b.cohort_name || '');
      case 'students':
        return (b.students_count || 0) - (a.students_count || 0);
      case 'overall':
        return (b.averages?.overall || 0) - (a.averages?.overall || 0);
      case 'workshop':
        return (b.averages?.workshop || 0) - (a.averages?.workshop || 0);
      default:
        return 0;
    }
  });

  return cohorts;
});

// Calculate overall statistics across all cohorts
const overallStats = computed(() => {
  if (!dataByCohort.value || dataByCohort.value.length === 0) {
    return {
      totalCohorts: 0,
      totalStudents: 0,
      avgOverallAttendance: null,
      avgWorkshopAttendance: null,
    };
  }

  const totalStudents = dataByCohort.value.reduce((sum, c) => sum + (c.students_count || 0), 0);

  // Calculate weighted averages
  let overallSum = 0;
  let overallWeight = 0;
  let workshopSum = 0;
  let workshopWeight = 0;

  dataByCohort.value.forEach(c => {
    const studentCount = c.students_count || 0;
    if (c.averages?.overall != null) {
      overallSum += c.averages.overall * studentCount;
      overallWeight += studentCount;
    }
    if (c.averages?.workshop != null) {
      workshopSum += c.averages.workshop * studentCount;
      workshopWeight += studentCount;
    }
  });

  return {
    totalCohorts: dataByCohort.value.length,
    totalStudents,
    avgOverallAttendance: overallWeight > 0 ? Math.round((overallSum / overallWeight) * 100) / 100 : null,
    avgWorkshopAttendance: workshopWeight > 0 ? Math.round((workshopSum / workshopWeight) * 100) / 100 : null,
  };
});

// Helper function to get color based on percentage
const getAttendanceColor = (percentage) => {
  if (percentage == null) return 'gray';
  if (percentage >= 80) return 'green';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 40) return 'orange';
  return 'red';
};

// Format percentage for display
const formatPercentage = (value) => {
  if (value == null) return 'N/A';
  return `${value.toFixed(1)}%`;
};
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-px">
        <StudentStatCard
          title="Total Cohorts"
          :count="overallStats.totalCohorts"
          icon="i-pajamas:users"
          icon-color="info"
          rounded-class="rounded-lg xl:rounded-none xl:rounded-l-lg"
        />

       <StudentStatCard
            title="Total Students"
            :count="overallStats.totalStudents"
            icon="i-lucide:graduation-cap"
            icon-color="success"
            rounded-class="rounded-lg xl:rounded-none xl:rounded-r-lg"
        />
    </div>

    <!-- Filters and Search -->
    <UInput
      v-model="searchQuery"
      icon="i-lucide:search"
      placeholder="Search cohorts..."
      class="w-full sm:w-64"
    />

    <!-- Cohort Cards -->
    <div v-if="attendanceLoading" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <USkeleton class="h-64" v-for="i in 4" :key="i" />
    </div>

    <div v-else-if="attendanceError" class="text-center py-8">
      <UIcon name="i-lucide:alert-circle" class="text-red-500 size-12 mx-auto mb-4" />
      <p class="text-muted">Error loading cohort data: {{ attendanceError }}</p>
    </div>

    <div v-else-if="filteredCohorts.length === 0" class="text-center py-8">
      <UIcon name="i-lucide:inbox" class="text-muted size-12 mx-auto mb-4" />
      <p class="text-muted">No cohorts found</p>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UCard
        v-for="cohort in filteredCohorts"
        :key="cohort.cohort_name"
        :ui="{
          header: 'border-b border-border',
          body: 'space-y-4'
        }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold text-highlighted">{{ cohort.cohort_name }}</h3>
              <p class="text-sm text-muted mt-1">
                {{ cohort.students_count }} student{{ cohort.students_count !== 1 ? 's' : '' }}
              </p>
            </div>
            <UBadge
              :color="getAttendanceColor(cohort.averages?.overall)"
              variant="subtle"
              size="lg"
            >
              {{ formatPercentage(cohort.averages?.overall) }}
            </UBadge>
          </div>
        </template>

        <!-- Attendance Averages -->
        <div>
          <h4 class="text-sm font-medium text-muted mb-3">Attendance Averages</h4>
          <div class="grid grid-cols-3 gap-3">
            <div class="text-center">
              <p class="text-xs text-muted mb-1">Workshop</p>
              <UBadge
                :color="getAttendanceColor(cohort.averages?.workshop)"
                variant="subtle"
                class="w-full"
              >
                {{ formatPercentage(cohort.averages?.workshop) }}
              </UBadge>
            </div>
            <div class="text-center">
              <p class="text-xs text-muted mb-1">Standup</p>
              <UBadge
                :color="getAttendanceColor(cohort.averages?.standup)"
                variant="subtle"
                class="w-full"
              >
                {{ formatPercentage(cohort.averages?.standup) }}
              </UBadge>
            </div>
            <div class="text-center">
              <p class="text-xs text-muted mb-1">Mentoring</p>
              <UBadge
                :color="getAttendanceColor(cohort.averages?.mentoring)"
                variant="subtle"
                class="w-full"
              >
                {{ formatPercentage(cohort.averages?.mentoring) }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Recordings vs Attended -->
        <div>
          <h4 class="text-sm font-medium text-muted mb-3">Recordings vs Attended</h4>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Workshops:</span>
              <span class="font-medium">
                {{ cohort.attended?.workshop || 0 }} / {{ cohort.recordings?.workshop || 0 }}
                <span class="text-muted ml-1">
                  ({{ formatPercentage(cohort.attended_vs_recorded_pct?.workshop) }})
                </span>
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Standups:</span>
              <span class="font-medium">
                {{ cohort.attended?.standup || 0 }} / {{ cohort.recordings?.standup || 0 }}
                <span class="text-muted ml-1">
                  ({{ formatPercentage(cohort.attended_vs_recorded_pct?.standup) }})
                </span>
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted">Mentoring:</span>
              <span class="font-medium">
                {{ cohort.attended?.mentoring || 0 }} / {{ cohort.recordings?.mentoring || 0 }}
                <span class="text-muted ml-1">
                  ({{ formatPercentage(cohort.attended_vs_recorded_pct?.mentoring) }})
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Cohort IDs (for debugging/reference) -->
        <div v-if="cohort.cohort_ids && cohort.cohort_ids.length > 1" class="pt-2 border-t border-border">
          <UTooltip
            :text="`This cohort spans ${cohort.cohort_ids.length} programs`"
            :delay-duration="0"
          >
            <div class="flex items-center gap-2 text-xs text-muted">
              <UIcon name="i-lucide:info" class="size-4" />
              <span>{{ cohort.cohort_ids.length }} program{{ cohort.cohort_ids.length !== 1 ? 's' : '' }}</span>
            </div>
          </UTooltip>
        </div>
      </UCard>
    </div>
  </div>
</template>
