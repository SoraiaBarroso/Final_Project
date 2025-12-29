<script setup>
const props = defineProps({
  cohort: {
    type: Object,
    required: true,
  },
});

const stats = computed(() => [
  {
    label: 'Workshop',
    value: props.cohort.averages?.workshop,
    icon: 'i-lucide-presentation',
  },
  {
    label: 'Standup',
    value: props.cohort.averages?.standup,
    icon: 'i-lucide-users',
  },
  {
    label: 'Mentoring',
    value: props.cohort.averages?.mentoring,
    icon: 'i-lucide-message-circle',
  },
  {
    label: 'Recording',
    value: props.cohort.averages?.recording,
    icon: 'i-lucide-video',
  },
]);
</script>

<template>
  <UCard
    class="group transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
    :ui="{
      root: 'overflow-hidden',
      header: 'pb-2',
      body: 'pt-0',
    }"
  >
    <template #header>
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold text-highlighted group-hover:text-primary transition-colors">
            {{ cohort.cohort_name }}
          </h3>
          <div class="flex items-center gap-1.5 mt-1">
            <UIcon name="i-lucide-users" class="size-3.5 text-muted" />
            <span class="text-sm text-muted">
              {{ cohort.students_count }} student{{ cohort.students_count !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>
        <UBadge
          v-if="cohort.averages?.overall != null"
          :color="cohort.averages.overall >= 75 ? 'success' : cohort.averages.overall >= 50 ? 'warning' : 'error'"
          variant="subtle"
          size="sm"
        >
          {{ cohort.averages.overall >= 75 ? 'Good' : cohort.averages.overall >= 50 ? 'Average' : 'Low' }}
        </UBadge>
      </div>
    </template>

    <!-- Main content with progress circle and stats -->
    <div class="flex items-center justify-between gap-6">
      <!-- Progress Circle -->
      <ProgressCircleGradient
        :percentage="cohort.averages?.overall"
        :size="110"
        :stroke-width="10"
        label="Overall"
      />

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 gap-1">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="rounded-lg p-2.5 transition-colors"
        >
          <div class="flex items-center gap-1.5 mb-1">
            <UIcon :name="stat.icon" class="size-3.5 text-muted" />
            <span class="text-xs text-muted">{{ stat.label }}</span>
          </div>
          <p class="text-lg font-semibold">
            {{ stat.value != null ? `${Math.round(stat.value)}%` : 'N/A' }}
          </p>
        </div>
      </div>
    </div>
  </UCard>
</template>
