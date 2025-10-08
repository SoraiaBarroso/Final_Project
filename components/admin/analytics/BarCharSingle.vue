<script lang="ts" setup>
type MeetingDataItem = {
  meetingType: string
  totalMeetings: number
  attendedMeetings: number
}

const MeetingData: MeetingDataItem[] = [
  { meetingType: 'Workshop', totalMeetings: 20, attendedMeetings: 17 },
  { meetingType: 'Standup', totalMeetings: 50, attendedMeetings: 46 },
  { meetingType: 'Mentoring', totalMeetings: 15, attendedMeetings: 12 },
]

const MeetingCategories = {
  totalMeetings: { name: 'Total Meetings', color: '#e5e7eb' },
  attendedMeetings: { name: 'Attended Meetings', color: '#3b82f6' },
}

const xFormatter = (i: number): string => `${MeetingData[i]?.meetingType || ''}`
const yFormatter = (tick: number) => tick.toString()
</script>

<template>
  <BarChart
    class="w-[80%]"
    :data="MeetingData"
    :height="460"
    :categories="MeetingCategories"
    :y-axis="['totalMeetings', 'attendedMeetings']"
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
