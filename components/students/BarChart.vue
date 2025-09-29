<script lang="ts" setup>
import { defineProps, watch } from 'vue';

const supabase = useSupabaseClient();

const props = defineProps<{ cohortId: string; userId: string }>();

type RevenueDataItem = {
  meetingName: string
  meetings: number
  attended: number
}

const RevenueData = ref<RevenueDataItem[]>([]);

const RevenueCategoriesMultple = {
  meetings: { name: 'Total Meetings', color: 'var(--color-primary-500)' },
  attended: { name: 'Attended', color: 'var(--color-primary-200)' },
}

const xFormatter = (i: number): string => RevenueData.value[i]?.meetingName || ''
const yFormatter = (tick: number) => tick.toString()

onMounted(async () => {
    console.log('Cohort ID:', props.cohortId, 'User ID:', props.userId);
    
    async function fetchData() {
      if (!props.cohortId || !props.userId) return;
      // Fetch total sessions from cohort_meetings
      const { data, error } = await supabase
        .from('cohort_meetings')
        .select('meeting_type, weeks')
        .eq('cohort_id', props.cohortId);
      if (error) {
        console.error('Error fetching meetings:', error);
        return;
      }
      let mentoringTotal = 0;
      let standupTotal = 0;
      type MeetingRow = { meeting_type: string; weeks: number };
      const rows = (data ?? []) as MeetingRow[];
      for (const row of rows) {
        if (row.meeting_type === 'mentoring') {
          mentoringTotal += row.weeks;
        } else if (row.meeting_type === 'standup') {
          standupTotal += row.weeks * 2;
        }
      }

      // Fetch attended sessions from student table
      type StudentAttended = { mentoring_attended: number; standup_attended: number };
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, mentoring_attended, standup_attended')
        .eq('id', props.userId)
        .single();
      if (studentError) {
        console.error('Error fetching student attended:', studentError);
        return;
      }
      const attended = (studentData ?? {}) as StudentAttended;
      const mentoringAttended = attended.mentoring_attended ?? 0;
      const standupAttended = attended.standup_attended ?? 0;

      RevenueData.value = [
        {
          meetingName: 'Mentoring',
          meetings: mentoringTotal,
          attended: mentoringAttended,
        },
        {
          meetingName: 'Standup',
          meetings: standupTotal,
          attended: standupAttended,
        },
      ];
    }

    watch(
      () => [props.cohortId, props.userId],
      ([cohortId, userId]) => {
        if (cohortId && userId) fetchData();
      },
      { immediate: true }
    );
  });
</script>

<template>
  <!-- <BarChart
    :data="RevenueData"
    :height="300"
    :categories="RevenueCategoriesMultple"
    :y-axis="['meetings', 'attended']"
    :group-padding="0"
    :bar-padding="0.2"
    :x-num-ticks="6"
    :radius="4"
    :x-formatter="xFormatter"
    :y-formatter="yFormatter"
    :legend-position="LegendPosition.Top"
    :hide-legend="false"
    :y-grid-line="true"
  /> -->
</template>
