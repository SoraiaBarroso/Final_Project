<script setup>
definePageMeta({
  layout: "default",
  middleware: ["admin"],
});

import BarCharSingle from '~/components/admin/analytics/BarCharSingle.vue';
import StudentStatCard from '~/components/StudentStatCard.vue';
import { useAttendance } from '~/composables/useAttendance';
import { onMounted, ref } from 'vue'

// reactive analytics data (will be populated from the API)
const attendanceOverall = ref(null)
const attendanceWorkshop = ref(null)
const attendanceMentoring = ref(null)
const attendanceStandup = ref(null)

const SumWorkshops = ref(0)
const SumMentorings = ref(0)
const SumStandups = ref(0)

const SumWorkshopAttended = ref(0)
const SumMentoringAttended = ref(0)
const SumStandupAttended = ref(0)
const studentCount = ref(0)

const isDataFetched = ref(false)

const { data: attendanceData, dataByCohort, error: attendanceError, loading: attendanceLoading, fetchAttendance, fetchAttendanceByCohort } = useAttendance()

onMounted(async () => {
  await fetchAttendance()
  await fetchAttendanceByCohort()
  console.log('Attendance data by cohort:', dataByCohort.value)
  const metrics = attendanceData.value ?? []
  for (const m of metrics) {
    if (m.metric === 'overall') attendanceOverall.value = m.percentage
    if (m.metric === 'workshop') attendanceWorkshop.value = m.percentage
    if (m.metric === 'mentoring') attendanceMentoring.value = m.percentage
    if (m.metric === 'standup') attendanceStandup.value = m.percentage
    if (m.metric === 'workshop_recordings') SumWorkshops.value = m.percentage
    if (m.metric === 'mentoring_recordings') SumMentorings.value = m.percentage
    if (m.metric === 'standup_recordings') SumStandups.value = m.percentage
    if (m.metric === 'workshop_attended') SumWorkshopAttended.value = m.percentage
    if (m.metric === 'mentoring_attended') SumMentoringAttended.value = m.percentage
    if (m.metric === 'standup_attended') SumStandupAttended.value = m.percentage
    if (m.metric === 'student_count') studentCount.value = m.percentage
  }
  isDataFetched.value = true
  console.log('Fetched attendance metrics:', SumWorkshops, SumMentorings, SumStandups, SumWorkshopAttended, SumMentoringAttended, SumStandupAttended, attendanceOverall, attendanceWorkshop, attendanceMentoring, attendanceStandup)
})
</script>

<template>
    <div class="grid grid-cols-1 grid-rows-2 gap-4 sm:gap-6 md:grid-cols-2 md:grid-rows-2 lg:grid-cols-2 lg:grid-rows-2 lg:gap-4 xl:grid-cols-4 xl:grid-rows-1 xl:gap-px">
        <StudentStatCard
            title="Average Attendance"
            :count="attendanceOverall"
            icon="i-pajamas:users"
            icon-color="info"
            rounded-class="rounded-lg xl:rounded-none xl:rounded-l-lg"
        />

        <StudentStatCard
            title="Workshops"
            :count="attendanceWorkshop"
            icon="i-pajamas:terminal"
            icon-color="info"
            rounded-class="rounded-lg xl:rounded-none"
        />

        <StudentStatCard
            title="Mentorings"
            :count="attendanceMentoring"
            icon="i-lucide:graduation-cap"
            icon-color="info"
            rounded-class="rounded-lg xl:rounded-none"
        />

        <StudentStatCard
            title="Stand-Ups"
            :count="attendanceStandup"
            icon="i-lucide:scan-face"
            icon-color="info"
            rounded-class="rounded-lg xl:rounded-none xl:rounded-r-lg"
        />
    </div>

    <UCard
      class="flex flex-col items-center overflow-y-auto h-full"
      :ui="{
        root: 'relative sm:min-h-[600px]',
        header: 'w-full border-b border-border px-4 xl:px-6 flex items-center gap-2 sticky top-0 z-10 bg-white',
        body: 'w-full flex justify-center items-center h-full',
      }"
    >
      <template #header>
          <h1 class="text-black/80 text-lg font-semibold">Attendance Overview</h1>

          <UTooltip arrow text="Shows the total number of scheduled meetings versus the number of meetings students actually attended, for each meeting type." :delay-duration="0">
              <UIcon name="i-lucide-info" class="text-muted text-currentColor size- cursor-pointer" />
          </UTooltip>
      </template>

        <BarCharSingle
          v-if="isDataFetched"
          :sumWorkshops="SumWorkshops"
          :sumStandups="SumStandups"
          :sumMentorings="SumMentorings"
          :sumWorkshopAttended="SumWorkshopAttended"
          :sumStandupAttended="SumStandupAttended"
          :sumMentoringAttended="SumMentoringAttended"
          :studentCount="studentCount"
        />
    </UCard>
</template>