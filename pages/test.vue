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
          :style="{ width: timelineWidth + 'px', minHeight: dynamicTimelineHeight + 'px' }"
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

// Global project templates that can be updated with real data
const projectTemplates: Record<string, Array<{title: string, type: 1 | 2 | 3 | 4, startDate: number, endDate: number, crossMonth?: boolean, season?: string, seasonColor?: string}>> = {
  // Default fallback data - will be replaced by real data
  "2025-08": [
    { title: 'Loading...', type: 1, startDate: 4, endDate: 9, season: 'Loading...', seasonColor: '#3b82f6' },
  ],
}

// Function to add seasons array to timeline
const addSeasonsToTimeline = (seasons: Array<{id: any, name: string, start_date: string, end_date: string}>) => {
  const timelineProjects: Record<string, any[]> = {};
  
  // Group seasons by base name (e.g., "Season 03") to consolidate specializations
  const groupedSeasons = groupSeasonsByBaseName(seasons);
  
  groupedSeasons.forEach((seasonGroup, seasonIndex) => {
    const startDate = new Date(seasonGroup.start_date);
    const endDate = new Date(seasonGroup.end_date);
    
    console.log(`Processing season group: ${seasonGroup.displayName}`, {
      seasonStart: seasonGroup.start_date,
      seasonEnd: seasonGroup.end_date,
      specializations: seasonGroup.specializations
    });

    // Create timeline items for each month the season spans
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!timelineProjects[monthKey]) {
        timelineProjects[monthKey] = [];
      }
      
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const itemStartInMonth = Math.max(startDate.getTime(), monthStart.getTime());
      const itemEndInMonth = Math.min(endDate.getTime(), monthEnd.getTime());
      
      const startDay = new Date(itemStartInMonth).getDate();
      const endDay = new Date(itemEndInMonth).getDate();
      const crossMonth = endDate > monthEnd;
      
      // Use the consolidated display name with specializations
      const title = seasonGroup.displayName;
      
      timelineProjects[monthKey].push({
        title: title,
        type: Math.min(4, seasonIndex + 1) as 1 | 2 | 3 | 4,
        startDate: startDay,
        endDate: endDay,
        crossMonth: crossMonth,
        season: seasonGroup.baseName, // Use base name for season initials
        seasonColor: getSeasonColorByIndex(seasonIndex),
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
      currentDate.setDate(1);
    }
  });
  
  console.log('Generated timeline projects:', timelineProjects);
  
  // Clear existing templates and update with real data
  Object.keys(projectTemplates).forEach(key => {
    delete projectTemplates[key];
  });
  Object.assign(projectTemplates, timelineProjects);
  
  // Reload current month view to show new data
  loadProjectsForCurrentMonth();
}

// Helper function to group seasons by base name and consolidate specializations
const groupSeasonsByBaseName = (seasons: Array<{id: any, name: string, start_date: string, end_date: string}>) => {
  const seasonGroups: Map<string, {
    baseName: string,
    displayName: string,
    specializations: string[],
    start_date: string,
    end_date: string,
    ids: any[]
  }> = new Map();
  
  seasons.forEach(season => {
    // Extract base season name and specialization
    const seasonInfo = extractSeasonInfo(season.name);
    
    if (seasonGroups.has(seasonInfo.baseName)) {
      // Add specialization to existing group
      const group = seasonGroups.get(seasonInfo.baseName)!;
      if (seasonInfo.specialization && !group.specializations.includes(seasonInfo.specialization)) {
        group.specializations.push(seasonInfo.specialization);
      }
      group.ids.push(season.id);
      
      // Update date range if necessary
      if (new Date(season.start_date) < new Date(group.start_date)) {
        group.start_date = season.start_date;
      }
      if (new Date(season.end_date) > new Date(group.end_date)) {
        group.end_date = season.end_date;
      }
    } else {
      // Create new group
      seasonGroups.set(seasonInfo.baseName, {
        baseName: seasonInfo.baseName,
        displayName: seasonInfo.baseName,
        specializations: seasonInfo.specialization ? [seasonInfo.specialization] : [],
        start_date: season.start_date,
        end_date: season.end_date,
        ids: [season.id]
      });
    }
  });
  
  // Create final display names with specializations
  return Array.from(seasonGroups.values()).map(group => ({
    ...group,
    displayName: group.specializations.length > 0 
      ? `${group.baseName} (${group.specializations.join(', ')})`
      : group.baseName
  }));
}

// Helper function to extract season base name and specialization
const extractSeasonInfo = (seasonName: string) => {
  // Pattern matching for different season formats
  const patterns = [
    // "Season 03 Software Engineer Cpp" -> base: "Season 03 Software Engineer", specialization: "Cpp"
    { 
      regex: /^(Season \d+ Software Engineer)\s+(Cpp|Go|Rust)$/i, 
      baseGroup: 1, 
      specializationGroup: 2 
    },
    // "Season 03 Machine Learning Python" -> base: "Season 03 Machine Learning", specialization: "Python"  
    { 
      regex: /^(Season \d+ Machine Learning)\s+(Python|R|TensorFlow)$/i, 
      baseGroup: 1, 
      specializationGroup: 2 
    },
    // "Season 02 Data Science Advanced" -> base: "Season 02 Data Science", specialization: "Advanced"
    { 
      regex: /^(Season \d+ Data Science)\s+(Advanced|Basic|Intermediate)$/i, 
      baseGroup: 1, 
      specializationGroup: 2 
    },
  ];
  
  for (const pattern of patterns) {
    const match = seasonName.match(pattern.regex);
    if (match) {
      return {
        baseName: match[pattern.baseGroup],
        specialization: match[pattern.specializationGroup]
      };
    }
  }
  
  // If no specialization pattern matches, return the full name as base
  return {
    baseName: seasonName,
    specialization: null
  };
}

// Helper function to get season colors by index
const getSeasonColorByIndex = (index: number) => {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];
  return colors[index % colors.length];
}

// Function to generate projects for a given month/year
const generateProjectsForMonth = (year: number, month: number) => {
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`
  return projectTemplates[monthKey] || []
}

// Function to load projects for current view
const loadProjectsForCurrentMonth = () => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  const projects = generateProjectsForMonth(year, month)
  const processedProjects = calculateNonOverlappingPositions(projects)
  
  projectItems.value = processedProjects.map((project: any, index: number) => ({
    ...project,
    id: `${year}-${month}-${index}`,
    avatars: ['/avatar1.jpg', '/avatar2.jpg'] // Default avatars
  }))
}

// Function to calculate non-overlapping positions for timeline items
const calculateNonOverlappingPositions = (projects: any[]) => {
  if (!projects.length) return projects;
  
  // Sort projects by start date to process them in order
  const sortedProjects = [...projects].sort((a, b) => a.startDate - b.startDate);
  
  // Track occupied rows and their end positions
  const occupiedRows: Array<{endDate: number, row: number}> = [];
  
  return sortedProjects.map((project) => {
    // Find the first available row for this project
    let assignedRow = 0;
    
    // Check each existing row to see if this project would overlap
    for (let i = 0; i < occupiedRows.length; i++) {
      const existingRow = occupiedRows[i];
      
      // If this project starts after the existing row ends (with 1 day buffer), we can use this row
      if (project.startDate > existingRow.endDate + 1) {
        assignedRow = existingRow.row;
        // Update this row's end date
        existingRow.endDate = project.endDate;
        break;
      }
    }
    
    // If no existing row was available, create a new row
    if (assignedRow === 0 || !occupiedRows.find(row => row.row === assignedRow && row.endDate < project.startDate - 1)) {
      assignedRow = occupiedRows.length;
      occupiedRows.push({
        endDate: project.endDate,
        row: assignedRow
      });
    }
    
    return {
      ...project,
      calculatedRow: assignedRow // Add calculated row for positioning
    };
  });
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

const dynamicTimelineHeight = computed(() => {
  if (!projectItems.value.length) return 364; // Default height
  
  // Find the maximum row used
  const maxRow = Math.max(
    ...projectItems.value.map(item => (item as any).calculatedRow || 0),
    0
  );
  
  const baseRowHeight = 64;
  const startOffset = 16;
  const bottomPadding = 20;
  
  return startOffset + ((maxRow + 1) * baseRowHeight) + bottomPadding;
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
  
  // Use calculated row for vertical positioning, with fallback to type-based positioning
  const baseRowHeight = 64; // Height of each row (56px item + 8px gap)
  const startOffset = 16; // Starting offset from top
  
  const calculatedRow = (item as any).calculatedRow;
  const verticalPosition = calculatedRow !== undefined 
    ? startOffset + (calculatedRow * baseRowHeight)
    : getTypeBasedPosition(item.type);
  
  return {
    left: `${startPosition}px`,
    width: `${itemWidth}px`,
    top: `${verticalPosition}px`
  }
}

// Fallback function for type-based positioning (when calculated row is not available)
const getTypeBasedPosition = (type: number) => {
  const positions: Record<number, number> = {
    1: 16,   // Season 01 / Early projects
    2: 80,   // Season 02 / Intermediate projects  
    3: 144,  // Season 03 / Advanced projects
    4: 208   // Specialized seasons (ML, Data Science, etc.)
  }
  return positions[type] || 16;
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

const supabase = useSupabaseClient()

const loadSeasonDeadlines = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    // First, get the student's cohort ID
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('cohort_id, program_id')
      .eq('email', session?.user?.email ?? '')
      .single();

    console.log("Student data:", student);

    // Now, use the cohort ID to query program_cohort_seasons
    const { data: seasonsProgress, error: progressError } = await supabase
      .from('program_cohort_seasons')
      .select(`
        start_date,
        end_date,
        cohort_id,
        seasons!inner (
          id,
          name,
          program_id
        )
      `)
      .eq('cohort_id', (student as any)?.cohort_id)
      .eq('program_id', (student as any)?.program_id)
      .order('start_date', { ascending: true, nullsFirst: false }); // Filter by the cohort ID you just fetched

    console.log("Seasons progress:", seasonsProgress);

    const seasons = seasonsProgress?.map((season: any) => ({
      id: season.seasons.id,
      name: season.seasons.name,
      start_date: season.start_date,
      end_date: season.end_date,
      type: 2,
    }));

    console.log("Seasons:", seasons);

    // Process seasons and add to timeline
    if (seasons) {
      addSeasonsToTimeline(seasons);
    }
}

// Keyboard navigation
onMounted(() => {
  // Load projects for the initial month
  loadProjectsForCurrentMonth()
  loadSeasonDeadlines()

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
