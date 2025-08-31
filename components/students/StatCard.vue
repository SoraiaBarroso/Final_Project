<template>
  <UCard
    class="flex flex-col items-center justify-center xl:rounded-lg 2xl:rounded-xl"
    :ui="{
      body: '2xl:!px-6 2xl:!py-4 xl:!px-6 w-full'
    }"
  >
    <div class="flex justify-between items-center">
      <p :class="['font-semibold', '2xl:text-3xl', 'xl:text-2xl']">{{ value }}</p>
      <div
        class="bg-elevated/60 p-2 rounded-lg flex justify-center items-center"
      >
        <UIcon :name="icon" size="22" class="text-blue-500" />
      </div>
    </div>
    <div
      class="text-muted"
      :class="['xl:mt-2', '2xl:mt-6', 'xl:text-base', '2xl:text-lg', 'xl:leading-7', '2xl:leading-8']"
    >
      {{ label }}
    </div>
  </UCard>
</template>

<script setup>
defineProps({
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
  }
});
</script>