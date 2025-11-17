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

// Get color type based on student status
const getStatusColor = (status) => {
  const statusColors = {
    'On Track': 'success',
    'Monitor': 'warning',
    'At Risk': 'error',
  }
  return statusColors[status] || 'info'
}

const getIconByStatus = (status) => {
  const statusIcons = {
    'On Track': 'i-pajamas:partner-verified',
    'Monitor': 'i-pajamas:eye',
    'At Risk': 'i-pajamas:status-alert',
  }
  return statusIcons[status] || 'i-lucide-help-circle'
}

const stats = computed(() => [
  {
    icon: getIconByStatus(props.student.status),
    label: 'Status',
    value: props.student.status || 'N/A',
    colorType: getStatusColor(props.student.status)
  },
  {
    icon: 'i-lucide-book-open',
    label: 'Current Season',
    value: formatSeasonName(props.student.current_season?.name),
    colorType: 'info'
  },
  {
    icon: 'i-lucide-activity',
    label: 'Expected Season',
    value: formatSeasonName(props.student.expected_season?.name),
    colorType: 'info'
  },
{
    icon: 'i-lucide-presentation',
    label: 'Completed Projects',
    value: props.student.completed_projects || 0,
    colorType: 'info'
  },
  {
    icon: 'i-lucide-check-circle',
    label: 'Completed Exercises',
    value: props.student.exercises_completed || 0,
    colorType: 'info'
  },
   {
    icon: 'i-lucide-trophy',
    label: 'Qwasar Points',
    value: props.student.points || 0,
    colorType: 'info'
  },
])


const getIconColor = (iconColor) => {
  const colorMap = {
    info: 'text-blue-500',
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
  };
  return colorMap[iconColor] || 'text-purple-500';
};

const getIconColorClass = (iconColor) => {
  const colorMap = {
    info: 'bg-info/10 ring-info/25 text-blue-500',
    success: 'bg-success/10 ring-success/25 text-green-500',
    error: 'bg-error/10 ring-error/25 text-red-500',
    warning: 'bg-warning/10 ring-warning/25 text-yellow-500',
  };
  return colorMap[iconColor] || 'bg-primary/10 ring-primary/25 text-purple-500';
};
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 h-full">
    <UPageCard
      v-for="stat in stats"
      :key="stat.label"
      :title="stat.label"
      variant="subtle"
      :icon="stat.icon"
      :ui="{
        leadingIcon: `${getIconColor(stat.colorType)} `,
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        title: 'font-medium text-muted text-xs uppercase',
        leading: `p-2.5 rounded-full ${getIconColorClass(stat.colorType)} ring ring-inset flex-col`,
      }"
      class="hover:z-1 hover:bg-elevated"
    >
      <p class="text-lg lg:text-xl xl:text-xl text-highlighted font-semibold">{{ stat.value }}</p>
    </UPageCard>
  </div>
</template>
