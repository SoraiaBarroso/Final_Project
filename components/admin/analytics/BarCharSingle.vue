<script lang="ts" setup>
type MeetingDataItem = {
  meetingType: string
  totalMeetings: number
  attendedMeetings: number
  attendancesPerStudent: number
}

const props = defineProps({
  sumWorkshops: { type: Number, required: true },
  sumStandups: { type: Number, required: true },
  sumMentorings: { type: Number, required: true },
  sumWorkshopAttended: { type: Number, required: true },
  sumStandupAttended: { type: Number, required: true },
  sumMentoringAttended: { type: Number, required: true },
});

onMounted(() => {
  console.log('Props received:', props);
});
const MeetingData: MeetingDataItem[] = [
  { meetingType: 'Workshop', totalMeetings: props.sumWorkshops, attendedMeetings: props.sumWorkshopAttended, attendancesPerStudent: Math.round(props.sumWorkshopAttended / 105) },
  { meetingType: 'Standup', totalMeetings: props.sumStandups, attendedMeetings: props.sumStandupAttended, attendancesPerStudent: Math.round(props.sumStandupAttended / 105) },
  { meetingType: 'Mentoring', totalMeetings: props.sumMentorings, attendedMeetings: props.sumMentoringAttended, attendancesPerStudent: Math.round(props.sumMentoringAttended / 105) },
]

const MeetingCategories = {
  totalMeetings: { name: 'Total Meetings', color: '#e5e7eb' },
  attendedMeetings: { name: 'Attended Meetings', color: '#3b82f6' },
  attendancesPerStudent: { name: 'Average Attendances per Student', color: '#10b981' },
}

const xFormatter = (i: number): string => `${MeetingData[i]?.meetingType}`
const yFormatter = (tick: number) => tick.toString()
</script>

<template>
  <BarChart
    class="w-[80%]"
    :data="MeetingData"
    :height="460"
    :categories="MeetingCategories"
    :y-axis="['totalMeetings', 'attendedMeetings', 'attendancesPerStudent']"
    :group-padding="0"
    :bar-padding="0.1"
    :x-num-ticks="1"
    :radius="10"
    :x-formatter="xFormatter"
    :y-formatter="yFormatter"
    :legend-position="LegendPosition.Top"
    :hide-legend="false"
    :y-grid-line="true"
  />
</template>
