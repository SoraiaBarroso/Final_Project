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
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <UCard
      v-for="stat in stats"
      :key="stat.label"
      :ui="{
        header: 'border-none',
        body: 'flex justify-between !pb-3 !pt-0',
      }"
    >
      <template #header>      
          <h1 class="text-muted text-sm">{{ stat.label }}</h1>
      </template>
      <p class="text-xl font-bold">{{ stat.value }}</p>
      <div
        :class="[
            stat.bgColor,
            stat.borderColor,
            'flex h-8 w-8 items-center justify-center rounded-full'
        ]"
        >
            <UIcon :name="stat.icon" :class="[stat.textColor, 'size-4']" />
        </div>
    </UCard>
  </div>
</template>
