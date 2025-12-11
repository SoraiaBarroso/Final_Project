<template>
  <UCard
    class="card flex flex-col items-center justify-center"
    :ui="{
      body: '2xl:!px-4 2xl:!py-3 xl:!px-6 !py-3 w-full flex flex-col gap-8',
    }"
  >
    <div class="flex items-center gap-4">
      <div class="text-primary-900 font-semibold xl:text-base 2xl:text-lg">
        {{ label }}
      </div>
    </div>
    <div class="flex w-full items-center justify-between gap-3">
      <p class="text-primary-900 font-semibold 2xl:text-lg">{{ value }}</p>
      <div v-if="percentage" class="flex items-center gap-2">
        <p class="text-muted text-base">progress</p>
        <UBadge color="primary" variant="subtle">{{ percentage }}</UBadge>
      </div>
      <!-- <p v-if="!percentage" class="text-muted text-base mt-1">completed</p> -->
    </div>
  </UCard>
</template>
<div className="min-h-screen w-full relative">

</div>
<script setup>
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
  });
</script>
