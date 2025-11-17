<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  }
})

// Format season name to shorter version (e.g., "Season 03 Software Engineer Cpp" -> "Season 03 SE")
const formatSeasonName = (fullName) => {
  if (!fullName) return 'N/A'

  // Extract season number/identifier (e.g., "Season 03")
  const seasonMatch = fullName.match(/^(Season\s+\d+)/i)
  const seasonPart = seasonMatch ? seasonMatch[1] : ''

  // Abbreviate program names
  const abbreviations = {
    'Software Engineer': 'SE',
    'Data Science': 'DS',
    'Machine Learning': 'ML',
    'Cpp': '',  // Remove language suffix
    'Go': '',
    'Rust': '',
  }

  let abbreviated = fullName
  for (const [full, abbr] of Object.entries(abbreviations)) {
    abbreviated = abbreviated.replace(new RegExp(full, 'gi'), abbr)
  }

  // Clean up extra spaces
  abbreviated = abbreviated.replace(/\s+/g, ' ').trim()

  return abbreviated
}

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
    icon: 'i-lucide-book-open',
    label: 'Current Season',
    value: formatSeasonName(props.student.current_season?.name),
    bgColor: 'bg-info/10',
    borderColor: 'border-info',
    textColor: 'text-info'
  },
  {
    icon: 'i-lucide-activity',
    label: 'Expected Season',
    value: formatSeasonName(props.student.expected_season?.name),
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
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
    <UCard
      v-for="stat in stats"
      :key="stat.label"
      :ui="{
        header: 'border-none flex items-center gap-2 mt-1',
        body: 'mt-2'
      }"
      class="h-full"
    >
      <template #header>
        <div class="h-2 w-2 rounded-full bg-[#00DC82]"></div>
        <h1 class="xl:text-lg font-medium">{{ stat.label }}</h1>
      </template>
      <p class="text-lg lg:text-lg xl:text-2xl text-highlighted font-semibold">{{ stat.value }}</p>
    </UCard>
  </div>
</template>
