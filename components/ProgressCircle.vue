<script setup>
const props = defineProps({
  percentage: {
    type: Number,
    default: null,
  },
  size: {
    type: Number,
    default: 90,
  },
  strokeWidth: {
    type: Number,
    default: 8,
  },
});

// Calculate circle properties
const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const center = computed(() => props.size / 2);

// Calculate progress
const offset = computed(() => {
  if (props.percentage == null) return circumference.value;
  const progress = Math.min(100, Math.max(0, props.percentage));
  return circumference.value - (progress / 100) * circumference.value;
});

// Use blue color for all progress circles
const color = computed(() => {
  if (props.percentage == null) return '#9ca3af';
  return '#3b82f6'; // blue
});

const formattedPercentage = computed(() => {
  if (props.percentage == null) return 'N/A';
  return `${Math.round(props.percentage)}%`;
});
</script>

<template>
  <div class="relative inline-flex items-center justify-center">
    <svg :width="size" :height="size" class="transform -rotate-90">
      <!-- Background circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        stroke="currentColor"
        fill="none"
        class="text-gray-200 dark:text-gray-700"
      />
      <!-- Progress circle -->
      <circle
        :cx="center"
        :cy="center"
        :r="radius"
        :stroke-width="strokeWidth"
        :stroke="color"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        stroke-linecap="round"
        class="transition-all duration-500 ease-out"
      />
    </svg>
    <!-- Percentage text -->
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-3xl font-bold">{{ formattedPercentage }}</span>
    </div>
  </div>
</template>
