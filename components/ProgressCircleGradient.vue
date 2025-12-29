<script setup>
const props = defineProps({
  percentage: {
    type: Number,
    default: null,
  },
  size: {
    type: Number,
    default: 120,
  },
  strokeWidth: {
    type: Number,
    default: 12,
  },
  label: {
    type: String,
    default: 'Overall',
  },
  animate: {
    type: Boolean,
    default: true,
  },
});

// Generate unique ID for gradient
const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

// Animation state
const isVisible = ref(false);
const circleRef = ref(null);
const animatedPercentage = ref(0);

// Calculate circle properties
const radius = computed(() => (props.size - props.strokeWidth) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const center = computed(() => props.size / 2);

// Calculate progress offset based on animated percentage
const offset = computed(() => {
  if (props.percentage == null) return circumference.value;
  const progress = Math.min(100, Math.max(0, animatedPercentage.value));
  return circumference.value - (progress / 100) * circumference.value;
});

// Gradient colors based on percentage
const gradientColors = computed(() => {
  if (props.percentage == null) return { start: '#9ca3af', end: '#6b7280' };

  if (props.percentage >= 75) {
    return { start: '#22c55e', end: '#16a34a' }; // Green
  } else if (props.percentage >= 50) {
    return { start: '#eab308', end: '#ca8a04' }; // Yellow
  } else {
    return { start: '#ef4444', end: '#dc2626' }; // Red
  }
});

const formattedPercentage = computed(() => {
  if (props.percentage == null) return 'N/A';
  return `${Math.round(animatedPercentage.value)}%`;
});

// Animate the percentage when visible
const animateProgress = () => {
  if (!props.animate || props.percentage == null) {
    animatedPercentage.value = props.percentage ?? 0;
    return;
  }

  const duration = 1000; // 1 second
  const startTime = performance.now();
  const startValue = 0;
  const endValue = props.percentage;

  const animate = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);

    animatedPercentage.value = startValue + (endValue - startValue) * easeOut;

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

// Intersection Observer for scroll animation
onMounted(() => {
  if (!props.animate) {
    animatedPercentage.value = props.percentage ?? 0;
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isVisible.value) {
          isVisible.value = true;
          animateProgress();
        }
      });
    },
    { threshold: 0.3 }
  );

  if (circleRef.value) {
    observer.observe(circleRef.value);
  }

  onUnmounted(() => {
    observer.disconnect();
  });
});

// Watch for percentage changes
watch(() => props.percentage, () => {
  if (isVisible.value) {
    animateProgress();
  }
});
</script>

<template>
  <div ref="circleRef" class="flex flex-col items-center">
    <div class="relative inline-flex items-center justify-center">
      <svg :width="size" :height="size" class="transform -rotate-90">
        <!-- Gradient definition -->
        <defs>
          <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" :stop-color="gradientColors.start" />
            <stop offset="100%" :stop-color="gradientColors.end" />
          </linearGradient>
        </defs>

        <!-- Background circle -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          :stroke-width="strokeWidth"
          stroke="currentColor"
          fill="none"
          class="text-gray-200 dark:text-gray-700/50"
        />

        <!-- Progress circle with gradient -->
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          :stroke-width="strokeWidth"
          :stroke="`url(#${gradientId})`"
          fill="none"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="offset"
          stroke-linecap="round"
          class="transition-all duration-300 ease-out drop-shadow-sm"
        />
      </svg>

      <!-- Center content -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-2xl font-bold text-highlighted">{{ formattedPercentage }}</span>
        <span v-if="label" class="text-xs text-muted mt-0.5">{{ label }}</span>
      </div>
    </div>
  </div>
</template>
