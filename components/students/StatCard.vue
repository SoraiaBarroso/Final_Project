<template>
  <UCard
    class="card flex flex-col items-center justify-center xl:rounded-lg 2xl:rounded-2xl "
    :ui="{
      body: '2xl:!px-6 2xl:!py-4 xl:!px-6 w-full flex flex-col gap-10',
    }"
  >
    <div class="flex gap-4 items-center">
      <div
        class="bg-primary-200 border-1 border-primary-300 p-3 rounded-full flex justify-center items-center"
      >
        <UIcon :name="icon" size="24" class="text-primary-800" />
      </div>
      <div
        class="text-primary-900 font-semibold 2xl:text-2xl xl:text-base"
      >
        {{ label }}
      </div>
    </div>
    <div class="flex justify-between items-center w-full px-1">
      <p class="text-primary-900 font-semibold 2xl:text-3xl xl:text-2xl">{{ value }}</p>
      <div v-if="percentage" class="flex items-center gap-2">
        <p class="text-muted text-base">progress</p>
        <UBadge color="primary" variant="subtle">{{ percentage }}</UBadge>
      </div>
      <p v-if="!percentage" class="text-muted text-base">completed</p>
    </div>
  </UCard>
</template>
<div className="min-h-screen w-full relative">

</div>
<script setup>
const props = defineProps({
  value: {
    type: [String, Number],
    required: true
  },
  label: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  percentage: {
    type: String,
  },
});
</script>