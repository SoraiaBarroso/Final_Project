<template>
  <UCard
    class="flex flex-col items-center justify-center xl:rounded-lg 2xl:rounded-2xl"
    :ui="{
      body: '2xl:!px-8 xl:!px-6 w-full'
    }"
  >
    <div class="flex justify-between items-center">
      <p :class="['font-semibold', '2xl:text-5xl', 'xl:text-2xl']">{{ value }}</p>
      <div
        class="bg-elevated/50 rounded-lg flex justify-center items-center"
        :class="['2xl:w-12 2xl:h-12 xl:w-10 xl:h-10']"
      >
        <UIcon :name="icon" size="24" class="text-blue-500" />
      </div>
    </div>
    <div
      class="text-muted uppercase w-2"
      :class="['xl:mt-2', '2xl:mt-6', 'xl:text-base', '2xl:text-xl', 'xl:leading-7', '2xl:leading-8']"
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