<template>
  <UCard
    class="card flex flex-col items-center justify-center xl:rounded-lg 2xl:rounded-2xl "
    :ui="{
      body: '2xl:!px-6 2xl:!py-6 xl:!px-6 w-full flex flex-col gap-10',
    }"
  >
    <div class="flex gap-4 items-center">
      <div
        class="bg-primary-200 border-1 border-primary-300 p-3 rounded-full flex justify-center items-center"
      >
        <UIcon :name="icon" size="22" class="text-blue-500" />
      </div>
      <div
        class="text-primary-900 font-semibold 2xl:text-2xl xl:text-base"
      >
        {{ label }}
      </div>
    </div>
    <p class="text-primary-900 font-semibold 2xl:text-3xl xl:text-2xl">{{ value }}</p>
  </UCard>
</template>
<div className="min-h-screen w-full relative">

</div>
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