<template>
  <div class="w-full bg-slate-50 rounded-xl p-6 font-sans">
    <!-- Header with month/year and navigation -->
    <div class="flex items-center justify-between mb-6">
      <button 
        @click="previousMonth" 
        class="bg-white border border-slate-200 rounded-lg w-10 h-10 flex items-center justify-center cursor-pointer text-lg text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
      >
        <UIcon name="lucide:chevron-left" />
      </button>
      <h2 class="text-2xl font-semibold text-slate-800 m-0">
        {{ formatMonthYear(currentDate) }}
      </h2>
      <button 
        @click="nextMonth" 
        class="bg-white border border-slate-200 rounded-lg w-10 h-10 flex items-center justify-center cursor-pointer text-lg text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
      >
        <UIcon name="lucide:chevron-right" />
      </button>
    </div>

    <!-- Zoom controls -->
    <!-- <div class="flex items-center gap-2 mb-4">
      <span class="text-sm text-slate-600">Zoom:</span>
      <input 
        type="range" 
        v-model="zoomLevel" 
        min="50" 
        max="200" 
        step="10"
        class="w-32"
      >
      <span class="text-sm text-slate-600">{{ zoomLevel }}%</span>
    </div> -->

    <!-- Scrollable timeline container -->
    <div class="relative overflow-hidden rounded-lg bg-white border border-slate-200">
      <!-- Timeline wrapper with horizontal scroll -->
      <div 
        ref="timelineContainer"
        class="overflow-x-auto overflow-y-hidden"
        @scroll="handleScroll"
      >
        <div 
          class="relative"
          :style="{ width: timelineWidth + 'px', minHeight: '364px' }"
        >
          <!-- Column borders background -->
          <div class="absolute inset-0 flex pointer-events-none">
            <div
              v-for="day in daysInMonth"
              :key="`border-${day}`"
              :style="{ width: columnWidth + 'px' }"
            />
          </div>

          <!-- Days header row -->
          <div class="sticky top-0 z-10">
            <div class="flex">
                <div
                v-for="day in daysInMonth"
                :key="day"
                class="p-2 text-center rounded-md"
                :style="{ width: columnWidth + 'px' }"
                >
                <div 
                  :class="[
                      isToday(day) ? 'bg-blue-600/70 text-white font-semibold' : '',
                      !isToday(day) && !isWeekend(day) ? 'bg-white' : ''
                  ]"
                  class="flex items-center justify-center flex-row-reverse gap-1.5 rounded-md px-1 py-1"
                >
                    <div :class="{'text-white': isToday(day), 'text-gray-400': !isToday(day)}" class="text-sm uppercase">
                    {{ getDayOfWeek(day) }}
                    </div>
                    <div class="text-sm font-semibold">{{ day }}</div>
                </div>
                </div>
            </div>
        </div>

        <!-- Timeline content area -->
        <div class="relative" style="min-height: 320px; padding-top: 16px;">
            <div class="flex absolute inset-0 pointer-events-none" style="z-index:0;">
                <div
                v-for="day in daysInMonth"
                :key="`bg-${day}`"
                class="border-r border-slate-200"
                :style="{ width: columnWidth + 'px', height: '100%' }"
                >
                <svg height="100%" width="100%" v-if="isWeekend(day)">
                  <defs>
                    <pattern id="doodad" width="16" height="16" viewBox="0 0 40 40" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
                      <rect width="100%" height="100%" fill="rgba(255, 255, 255,1)"/>
                      <path d="M-10 30h60v1h-60zM-10-10h60v1h-60" fill="rgba(203, 213, 224,1)"/>
                      <path d="M-10 10h60v1h-60zM-10-30h60v1h-60z" fill="rgba(203, 213, 224,1)"/>
                    </pattern>
                  </defs>
                  <rect fill="url(#doodad)" height="200%" width="200%"/>
                </svg>
                </div>
            </div>
        <!-- Project items -->
        <div
            v-for="item in projectItems"
            :key="item.id"
            class="absolute h-14 px-3 py-2 bg-white flex items-center justify-between shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            :class="[
              item.crossMonth ? 'rounded-l-lg border-r-2 border-dashed border-gray-300' : 'rounded-lg',
              item.title.includes('(cont.)') ? 'rounded-r-lg rounded-l-none border-l-2 border-dashed border-gray-300' : ''
            ]"
            :style="getItemStyle(item)"
        >
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <!-- Season color indicator -->
              <div 
                :class="getItemClasses(item.type)"
                :style="{ backgroundColor: item.seasonColor }"
              ></div>
              <div class="flex items-center justify-between min-w-0 w-full">
                <span class="text-sm font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">
                    {{ item.title }}
                </span>
                <!-- Season badge with initials -->
                <span 
                  v-if="item.season" 
                  class="text-xs px-2 py-0.5 rounded-full text-white w-fit font-semibold"
                  :style="{ backgroundColor: item.seasonColor + '90' }" 
                >
                  {{ getSeasonInitials(item.season) }}
                </span>
              </div>
            </div>
            <!-- Cross-month indicator -->
            <div v-if="item.crossMonth" class="text-xs text-gray-400 ml-2 flex items-center">
              <UIcon v-if="item.title.includes('(cont.)')" name="lucide:chevron-left" class="size-4"/>
              <UIcon v-else name="lucide:chevron-right" class="size-4" />
            </div>
        </div>
        </div>
        </div>
      </div>
    </div>

    <!-- Scroll indicator -->
    <div class="flex items-center justify-center mt-2 text-xs text-slate-500">
      <span>Scroll horizontally to see more days</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { UIcon } from '#components';

definePageMeta({
  layout: 'custom',
});

interface ProjectItem {
  id: string
  title: string
  type: 1 | 2 | 3 | 4
  startDate: number // day of month
  endDate: number // day of month
  avatars: string[]
  crossMonth?: boolean // Indicates if this project spans multiple months
  season?: string // Season/curriculum context
  seasonColor?: string // Visual indicator for season
}

const currentDate = ref(new Date())
const zoomLevel = ref(50)
const timelineContainer = ref<HTMLElement>()

// Dynamic project items based on month/year
const projectItems = ref<ProjectItem[]>([])

// Function to generate projects for a given month/year
const generateProjectsForMonth = (year: number, month: number) => {
  // This would typically come from your database/API
  const projectTemplates: Record<string, Array<{title: string, type: 1 | 2 | 3 | 4, startDate: number, endDate: number, crossMonth?: boolean, season?: string, seasonColor?: string}>> = {
    // Format: "YYYY-MM": projects for that month
    "2025-05": [ // May 2025 - 3 months back
      { title: 'My Ls Project', type: 1, startDate: 15, endDate: 22, season: 'Season 01 Arc 01', seasonColor: '#3b82f6' },
    ],
    "2025-06": [ // June 2025 - 2 months back
      { title: 'My Minishell Project', type: 2, startDate: 1, endDate: 15, season: 'Season 01 Arc 02', seasonColor: '#10b981' },
    ],
    "2025-07": [ // July 2025 - 1 month back
      { title: 'My Rush Project', type: 3, startDate: 20, endDate: 31, season: 'Season 02 Software Engineer', seasonColor: '#f59e0b' },
    ],
    "2025-08": [ // August 2025 - current month
      { title: 'My Cat Project', type: 1, startDate: 4, endDate: 9, season: 'Season 02 Software Engineer', seasonColor: '#f59e0b' },
      { title: 'My Ngram Project', type: 2, startDate: 10, endDate: 18, season: 'Season 02 Software Engineer', seasonColor: '#f59e0b' },
      { title: 'My Mastermind Project', type: 2, startDate: 19, endDate: 26, season: 'Season 02 Software Engineer', seasonColor: '#f59e0b' },
      { title: 'My Printf Project', type: 3, startDate: 28, endDate: 31, crossMonth: true, season: 'Season 03 Software Engineer Cpp', seasonColor: '#ef4444' }, // Continues to September
    ],
    "2025-09": [ // September 2025 - 1 month ahead
      { title: 'My Printf Project (cont.)', type: 3, startDate: 1, endDate: 7, crossMonth: true, season: 'Season 03 Software Engineer Cpp', seasonColor: '#ef4444' }, // Continued from August
      { title: 'My Push Swap Project', type: 2, startDate: 10, endDate: 20, season: 'Season 03 Software Engineer Cpp', seasonColor: '#ef4444' },
    ],
    "2025-10": [ // October 2025 - 2 months ahead
      { title: 'My Minitalk Project', type: 3, startDate: 1, endDate: 15, season: 'Season 03 Software Engineer Cpp', seasonColor: '#ef4444' },
    ],
    "2025-11": [ // November 2025 - 3 months ahead
      { title: 'My So Long Project', type: 4, startDate: 10, endDate: 30, season: 'Season 03 Machine Learning', seasonColor: '#8b5cf6' },
    ],
  }
  
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  return projectTemplates[monthKey] || []
}

// Function to load projects for current view
const loadProjectsForCurrentMonth = () => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const projects = generateProjectsForMonth(year, month)
  projectItems.value = projects.map((project: any, index: number) => ({
    ...project,
    id: `${year}-${month}-${index}`,
    avatars: ['/avatar1.jpg', '/avatar2.jpg'] // Default avatars
  }))
}

// Computed properties
const daysInMonth = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const days = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: days }, (_, i) => i + 1)
})

const columnWidth = computed(() => {
  return Math.max(60, (zoomLevel.value / 100) * 80)
})

const timelineWidth = computed(() => {
  return daysInMonth.value.length * columnWidth.value
})

// Methods
const formatMonthYear = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
}

const getDayOfWeek = (day: number) => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const date = new Date(year, month, day)
  return date.toLocaleDateString('en-US', { weekday: 'narrow' })
}

const isToday = (day: number) => {
  const today = new Date()
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  return today.getFullYear() === year && 
         today.getMonth() === month && 
         today.getDate() === day
}

const isWeekend = (day: number) => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const date = new Date(year, month, day)
  const dayOfWeek = date.getDay()
  return dayOfWeek === 0 || dayOfWeek === 6 // Sunday or Saturday
}

const getItemStyle = (item: ProjectItem) => {
  const startPosition = (item.startDate - 1) * columnWidth.value
  const duration = item.endDate - item.startDate + 1
  const itemWidth = duration * columnWidth.value
  
  // Calculate vertical position based on item type  
  const positions = {
    1: '16px',   // Season 01 / Early projects
    2: '80px',   // Season 02 / Intermediate projects
    3: '144px',  // Season 03 / Advanced projects
    4: '208px'   // Specialized seasons (ML, Data Science, etc.)
  }
  
  return {
    left: `${startPosition}px`,
    width: `${itemWidth}px`,
    top: positions[item.type] || '16px'
  }
}

const getItemClasses = (type: number) => {
  const classes: Record<number, string> = {
    1: 'h-8 w-1.5 bg-blue-600 rounded-md',
    2: 'h-8 w-1.5 bg-green-600 rounded-md',
    3: 'h-8 w-1.5 bg-yellow-600 rounded-md',
    4: 'h-8 w-1.5 bg-red-600 rounded-md'
  }
  return classes[type] || 'h-8 w-1.5 bg-gray-600 rounded-md'
}

const getItemIcon = (type: string) => {
  const icons: Record<string, string> = {
    research: '🔍',
    development: '⚙️',
    design: '🎨',
    landing: '📄'
  }
  return icons[type] || '📋'
}

// Convert season name to initials
const getSeasonInitials = (seasonName: string) => {
  if (!seasonName) return ''
  
  // Handle different season patterns
  const patterns = [
    // Season 01 Arc 01 -> S1A1
    { regex: /Season (\d+) Arc (\d+)/i, format: (match: RegExpMatchArray) => `S${match[1]}A${match[2]}` },
    // Season 02 Software Engineer -> S2
    { regex: /Season (\d+) Software Engineer/i, format: (match: RegExpMatchArray) => `S${match[1]}` },
    // Season 03 Software Engineer Cpp -> S3C++
    { regex: /Season (\d+) Software Engineer Cpp/i, format: (match: RegExpMatchArray) => `S${match[1]}C++` },
    // Season 03 Software Engineer Rust -> S3R
    { regex: /Season (\d+) Software Engineer Rust/i, format: (match: RegExpMatchArray) => `S${match[1]}R` },
    // Season 03 Software Engineer Go -> S3Go
    { regex: /Season (\d+) Software Engineer Go/i, format: (match: RegExpMatchArray) => `S${match[1]}Go` },
    // Season 03 Machine Learning -> S3ML
    { regex: /Season (\d+) Machine Learning/i, format: (match: RegExpMatchArray) => `S${match[1]}ML` },
    // Season 02 Data Science -> S2DS
    { regex: /Season (\d+) Data Science/i, format: (match: RegExpMatchArray) => `S${match[1]}DS` },
    // Generic Season XX -> SXX
    { regex: /Season (\d+)/i, format: (match: RegExpMatchArray) => `S${match[1]}` },
    // Preseason Data -> PD
    { regex: /Preseason Data/i, format: () => 'PD' },
    // Preseason Web -> PW
    { regex: /Preseason Web/i, format: () => 'PW' },
  ]
  
  for (const pattern of patterns) {
    const match = seasonName.match(pattern.regex)
    if (match) {
      return pattern.format(match)
    }
  }
  
  // Fallback: take first letter of each word
  return seasonName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 4) // Limit to 4 characters
}

const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
  loadProjectsForCurrentMonth() // Load projects for new month
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
  loadProjectsForCurrentMonth() // Load projects for new month
}

const handleScroll = () => {
  // Optional: Add scroll position tracking or snap-to-grid functionality
}

// Method to add new project items (for future use)
const addProjectItem = (item: Omit<ProjectItem, 'id'>) => {
  const newItem: ProjectItem = {
    ...item,
    id: Date.now().toString()
  }
  projectItems.value.push(newItem)
}

// Keyboard navigation
onMounted(() => {
  // Load projects for the initial month
  loadProjectsForCurrentMonth()
  
  const handleKeydown = (event: KeyboardEvent) => {
    if (!timelineContainer.value) return
    
    const scrollAmount = columnWidth.value * 2
    
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      timelineContainer.value.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      timelineContainer.value.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }
  
  window.addEventListener('keydown', handleKeydown)
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
  })
})
</script>
