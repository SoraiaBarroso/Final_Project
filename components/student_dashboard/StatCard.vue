<template>
  <UCard
    class="flex flex-col items-center justify-center"
    :class=styles
    :ui="{
      body: '2xl:!px-4 2xl:!py-3 xl:!px-6 !px-4 !py-2 w-full flex items-center gap-4 xl:min-w-[140px]',
    }"
  >
   <div class="flex justify-center items-center bg-primary-100 w-fit h-fit p-2 xl:p-3 rounded-sm xl:rounded-lg">
      <UIcon
        :name="icon"
        class="text-primary-500 dark:text-primary-600 size-4 xl:size-6"
      />
    </div>
    <div class="flex flex-col gap-1">
      <div class="text-primary-900 font-semibold text-xs text-nowrap xl:text-base">
        {{ label }}
      </div>
       <p class="text-primary-900 font-semibold text-xs 2xl:text-sm">{{ displayValue }}</p>
        <div v-if="percentage" class="flex items-center gap-2">
          <p class="text-muted text-base">progress</p>
          <UBadge color="primary" variant="subtle">{{ percentage }}</UBadge>
        </div>
    </div>
  </UCard>
</template>
<div className="min-h-screen w-full relative">

</div>
<script setup>
import { computed } from 'vue';

  const props = defineProps({
    value: {
      type: [String, Number],
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    percentage: {
      type: String,
    },
    styles: {
      type: String,
      default: '',
    },
  });

  const displayValue = computed(() => {
    if (typeof props.value !== 'string') return props.value;

    // Match pattern like "Season 03 Software Engineer Cpp"
    const match = props.value.match(/^(Season \d+)\s+(.+)$/);
    if (match) {
      const seasonPart = match[1]; // "Season 03"
      const titlePart = match[2]; // "Software Engineer Cpp"

      // Get initials from the title part
      const initials = titlePart
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('');

      return `${seasonPart} ${initials}`;
    }

    return props.value;
  });
</script>
