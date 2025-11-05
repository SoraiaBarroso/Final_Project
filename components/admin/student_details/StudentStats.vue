<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  }
})

const stats = computed(() => [
    {
    icon: 'i-lucide-users',
    label: 'Status',
    value: props.student.status || 'N/A',
    bgColor: 'bg-info/10',
    borderColor: 'border-info',
    textColor: 'text-info'
  },
{
    icon: 'i-lucide-presentation',
    label: 'Completed Projects',
    value: props.student.completed_projects || 0,
    bgColor: 'bg-info/10',
    borderColor: 'border-info',
    textColor: 'text-info'
  },
  {
    icon: 'i-lucide-check-circle',
    label: 'Completed Exercises',
    value: props.student.exercises_completed || 0,
    bgColor: 'bg-info/10',
    borderColor: 'border-info',
    textColor: 'text-info'
  },
   {
    icon: 'i-lucide-trophy',
    label: 'Qwasar Points',
    value: props.student.points || 0,
    bgColor: 'bg-info/10',
    borderColor: 'border-info',
    textColor: 'text-info'
  },
])
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 h-full">
    <UCard
      v-for="stat in stats"
      :key="stat.label"
      :ui="{
        header: 'border-none',
        body: 'flex justify-between items-center !pt-0 w-full',
      }"
      class="h-full"
    >
      <template #header>
          <h1 class="text-muted text-sm font-medium">{{ stat.label }}</h1>
      </template>
      <p class="text-xl font-bold">{{ stat.value }}</p>
      <div
        :class="[
            stat.bgColor,
            stat.borderColor,
            'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0'
        ]"
        >
            <UIcon :name="stat.icon" :class="[stat.textColor, 'size-5']" />
        </div>
    </UCard>
  </div>
</template>
