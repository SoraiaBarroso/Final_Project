<template>
  <UCard
    class="card flex flex-col items-center justify-center"
    :ui="{
      body: '2xl:!px-6 2xl:!py-4 xl:!px-6 w-full flex flex-col gap-8',
    }"
  >
    <div class="flex items-center gap-4">
      <div
        class="bg-primary-200 border-primary-300 flex items-center justify-center rounded-full border-1 p-3"
      >
        <UIcon :name="icon" size="24" class="text-primary-800" />
      </div>
      <div class="text-primary-900 font-semibold xl:text-base 2xl:text-2xl">
        {{ label }}
      </div>
    </div>
    <div class="flex w-full items-center justify-between px-1">
      <p class="text-primary-900 font-semibold xl:text-2xl 2xl:text-3xl">{{ value }}</p>
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
