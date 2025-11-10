<template>
      <UDashboardPanel id="calendar">
      <template #header>
          <UDashboardNavbar title="Calendar" >
              <template #leading>
                  <UDashboardSidebarCollapse />
              </template>
          </UDashboardNavbar>
      </template>

      <template #body>
         <div class="flex h-full flex-col rounded-xl  font-sans">
    <!-- Header with month/year and navigation -->
    <div class="mb-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <UButton
          @click="previousMonth"
          color="neutral"
          variant="link"
          size="xl"
          class="cursor-pointer"
          :disabled="
            allowedStartDate &&
            currentDate.getFullYear() === allowedStartDate.getFullYear() &&
            currentDate.getMonth() === allowedStartDate.getMonth()
          "
        >
          <UIcon name="lucide:chevron-left" />
        </UButton>
        <UButton @click="goToToday" size="xl" color="neutral" variant="outline"> Today </UButton>
        <UButton
          color="neutral"
          variant="link"
          size="xl"
          @click="nextMonth"
          class="cursor-pointer"
          :disabled="
            allowedEndDate &&
            currentDate.getFullYear() === allowedEndDate.getFullYear() &&
            currentDate.getMonth() === allowedEndDate.getMonth()
          "
        >
          <UIcon name="lucide:chevron-right" />
        </UButton>
      </div>
      <h2 class="m-0 text-2xl font-semibold text-slate-800">
        {{ formatMonthYear(currentDate) }}
      </h2>
      <!-- Season dropdown -->
      <USelect
        size="xl"
        v-model="selectedSeasonId"
        :items="studentSeasons"
        :ui="{
          trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
        }"
        placeholder="Filter by Seasons"
        class="min-w-28"
      />
    </div>

    <!-- Scrollable timeline container -->
    <div class="relative h-full overflow-hidden rounded-lg border border-slate-200 bg-white">
      <!-- Timeline wrapper with horizontal scroll -->
      <div ref="timelineContainer" class="timeline h-full overflow-x-auto overflow-y-hidden">
        <div
          class="relative h-full"
          :style="{ width: timelineWidth + 'px', minHeight: dynamicTimelineHeight + 'px' }"
        >
          <div
            v-if="todayLinePosition !== null"
            :style="{
              left: todayLinePosition + 30 + 'px',
              height: '92%',
              width: '2px',
            }"
            class="pointer-events-none absolute bottom-0 bg-blue-500/80"
          ></div>
          <!-- Column borders background -->
          <div class="pointer-events-none absolute inset-0 flex">
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
                class="rounded-md p-2 text-center"
                :style="{ width: columnWidth + 'px' }"
              >
                <div
                  :class="[
                    isToday(day) ? 'bg-blue-600/70 font-semibold text-white' : '',
                    !isToday(day) && !isWeekend(day) ? 'bg-white' : '',
                  ]"
                  class="flex flex-row-reverse items-center justify-center gap-1.5 rounded-md px-1 py-1"
                >
                  <div
                    :class="{ 'text-white': isToday(day), 'text-gray-400': !isToday(day) }"
                    class="text-sm uppercase"
                  >
                    {{ getDayOfWeek(day) }}
                  </div>
                  <div class="text-sm font-semibold">{{ day }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Timeline content area -->
          <div class="relative" style="height: 100%; padding-top: 16px">
            <div class="pointer-events-none absolute inset-0 flex" style="z-index: 0">
              <div
                v-for="day in daysInMonth"
                :key="`bg-${day}`"
                class="border-r border-slate-200"
                :style="{ width: columnWidth + 'px', height: '100%' }"
              >
                <svg height="100%" width="100%" v-if="isWeekend(day)">
                  <defs>
                    <pattern
                      id="doodad"
                      width="16"
                      height="16"
                      viewBox="0 0 40 40"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(135)"
                    >
                      <rect width="100%" height="100%" fill="rgba(255, 255, 255,1)" />
                      <path d="M-10 30h60v1h-60zM-10-10h60v1h-60" fill="rgba(203, 213, 224,1)" />
                      <path d="M-10 10h60v1h-60zM-10-30h60v1h-60z" fill="rgba(203, 213, 224,1)" />
                    </pattern>
                  </defs>
                  <rect fill="url(#doodad)" height="200%" width="200%" />
                </svg>
              </div>
            </div>
            <!-- Project items -->
            <div
              v-for="item in projectItems"
              :key="item.id"
              class="absolute flex h-14 cursor-pointer items-center justify-between bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              :class="[
                item.crossMonth
                  ? 'rounded-l-lg border-r-2 border-dashed border-gray-300'
                  : 'rounded-lg',
                item.title?.includes('(cont.)')
                  ? 'rounded-l-none rounded-r-lg border-l-2 border-dashed border-gray-300'
                  : '',
              ]"
              :style="getItemStyle(item)"
            >
              <div class="flex min-w-0 flex-1 items-center gap-3">
                <!-- Season color indicator -->
                <div
                  :class="getItemClasses(item.type)"
                  :style="{ backgroundColor: item.seasonColor }"
                ></div>
                <div class="flex w-full min-w-0 items-center justify-between">
                  <span
                    class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-gray-700"
                  >
                    {{ item.title }}
                  </span>
                  <!-- Season badge with initials -->
                  <span
                    v-if="item.season"
                    class="w-fit rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                    :style="{ backgroundColor: item.seasonColor + '90' }"
                  >
                    {{ getSeasonInitials(item.season) }}
                  </span>
                </div>
              </div>
              <!-- Cross-month indicator -->
              <div v-if="item.crossMonth" class="ml-2 flex items-center text-xs text-gray-400">
                <UIcon
                  v-if="item.title.includes('(cont.)')"
                  name="lucide:chevron-left"
                  class="size-4"
                />
                <UIcon v-else name="lucide:chevron-right" class="size-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
      </template>
  </UDashboardPanel>
 
</template>

<script setup lang="ts">
  definePageMeta({
    layout: "custom",
  });

  const today = new Date();
  const currentDate = ref(new Date());
  const zoomLevel = ref(50);
  const timelineContainer = ref<HTMLElement>();

  const allowedStartDate = ref<Date | undefined>(undefined);
  const allowedEndDate = ref<Date | undefined>(undefined);

  // Dynamic project items based on month/year
  const projectItems = ref<ProjectItem[]>([]);

  // For season dropdown
  const studentSeasons = ref<Array<{ label: string; value: string }>>([]);
  const selectedSeasonId = ref<string | undefined>(undefined);

  // Store program_id for later use
  const studentProgramId = ref<string | null>(null);
  const studentCohortId = ref<string | null>(null);
  const cohortSeasonsDeadlines = ref<
    Array<{ id: string; name: string; start_date: string; end_date: string; type: number }>
  >([]);

  // Go to today: show previous, current, and next month
  const goToToday = () => {
    currentDate.value = new Date(today.getFullYear(), today.getMonth(), 1);
    loadProjectsForCurrentMonth();
  };

  // When dropdown changes show the timeline for that specific season
  watch(
    () => selectedSeasonId.value,
    async (newVal) => {
      const selectedSeason = cohortSeasonsDeadlines.value.find((season) => season.id === newVal);
      if (!selectedSeason) return;

      const startDate = new Date(selectedSeason.start_date);
      const endDate = new Date(selectedSeason.end_date);

      allowedStartDate.value = startDate;
      allowedEndDate.value = endDate;

      currentDate.value = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

      // Load projects for this season
      await loadProjectsForSeason(selectedSeason.id);

      // Scroll to the start day of the season in the current month
      if (
        currentDate.value.getFullYear() === startDate.getFullYear() &&
        currentDate.value.getMonth() === startDate.getMonth()
      ) {
        scrollToDay(startDate.getDate());
      }
    }
  );

  // scroll to the start of the season when changinn seasons
  const scrollToDay = (day: number) => {
    if (!timelineContainer.value) return;
    // Calculate the horizontal scroll position
    const scrollLeft = (day - 1) * columnWidth.value;
    timelineContainer.value.scrollTo({ left: scrollLeft, behavior: "smooth" });
  };

  // Fetch projects for a given season using program_cohort_season_projects table
  const loadProjectsForSeason = async (seasonId: string) => {
    console.log("🔍 loadProjectsForSeason called with seasonId:", seasonId);

    if (!seasonId) {
      console.warn("❌ No seasonId provided");
      return;
    }

    const programId = studentProgramId.value;
    const cohortId = studentCohortId.value;

    console.log("📋 Student info:", { programId, cohortId, seasonId });

    if (!programId || !cohortId) {
      console.warn("❌ Missing programId or cohortId");
      return;
    }

    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    console.log("📅 Current month:", { year, month, monthStart, monthEnd });

    // First, get the program_cohort_season_id for this season, cohort, and program
    const { data: pcsData, error: pcsError } = await supabase
      .from("program_cohort_seasons")
      .select("id")
      .eq("season_id", seasonId)
      .eq("cohort_id", cohortId)
      .eq("program_id", programId)
      .single();

    console.log("🔗 program_cohort_seasons query result:", { pcsData, pcsError });

    if (pcsError || !pcsData) {
      console.error("❌ Error fetching program_cohort_season:", pcsError);
      return;
    }

    const programCohortSeasonId = pcsData.id;
    console.log("✅ Found program_cohort_season_id:", programCohortSeasonId);

    // Now fetch all projects for this program_cohort_season with their actual dates
    const { data: projectSchedules, error: scheduleError } = await supabase
      .from("program_cohort_season_projects")
      .select(`
        id,
        start_date,
        end_date,
        projects!inner (
          id,
          name,
          description
        )
      `)
      .eq("program_cohort_season_id", programCohortSeasonId);

    console.log("📦 Project schedules query result:", { projectSchedules, scheduleError });

    if (scheduleError) {
      console.error("❌ Error fetching project schedules:", scheduleError);
      return;
    }

    const schedules = (projectSchedules || []) as any[];
    console.log(`📊 Found ${schedules.length} project schedules`);

    if (schedules.length === 0) {
      console.warn("⚠️ No projects found for this season");
      projectItems.value = [];
      return;
    }

    // Get season info for color
    const selectedSeason = cohortSeasonsDeadlines.value.find((season) => season.id === seasonId);
    const seasonName = selectedSeason?.name || "Unknown Season";

    let timelineProjects: any[] = [];

    // Check for bootcamp projects (can be grouped)
    const bootcampProjects = schedules.filter((s: any) =>
      s.projects.description && String(s.projects.description).toLowerCase().includes("bootcamp")
    );
    const regularProjects = schedules.filter((s: any) =>
      !s.projects.description || !String(s.projects.description).toLowerCase().includes("bootcamp")
    );

    // Handle bootcamp projects (group them together)
    if (bootcampProjects.length > 0) {
      // Find the earliest start and latest end for bootcamp projects
      const bootcampStart = new Date(Math.min(...bootcampProjects.map((p: any) => new Date(p.start_date).getTime())));
      const bootcampEnd = new Date(Math.max(...bootcampProjects.map((p: any) => new Date(p.end_date).getTime())));

      // Only show if overlaps with current month
      if (!(bootcampEnd < monthStart || bootcampStart > monthEnd)) {
        const startDay = Math.max(1, bootcampStart > monthStart ? bootcampStart.getDate() : 1);
        const endDay = Math.min(
          monthEnd.getDate(),
          bootcampEnd < monthEnd ? bootcampEnd.getDate() : monthEnd.getDate()
        );

        timelineProjects.push({
          title: bootcampProjects[0].projects.description,
          type: 4,
          startDate: startDay,
          endDate: endDay,
          season: seasonName,
          seasonColor: "#3b82f6",
          id: `grouped-bootcamp-${programCohortSeasonId}`,
          crossMonth: bootcampEnd > monthEnd,
          avatars: [],
        });
      }
    }

    // Handle regular projects individually
    regularProjects.forEach((schedule: any) => {
      const start = new Date(schedule.start_date);
      const end = new Date(schedule.end_date);

      console.log(`📌 Processing project: ${schedule.projects.name}`, {
        start: start.toISOString(),
        end: end.toISOString(),
        monthStart: monthStart.toISOString(),
        monthEnd: monthEnd.toISOString(),
      });

      // Only show if overlaps with current month
      if (end < monthStart || start > monthEnd) {
        console.log(`⏭️ Skipping (no overlap with current month)`);
        return;
      }

      const startDay = Math.max(1, start > monthStart ? start.getDate() : 1);
      const endDay = Math.min(
        monthEnd.getDate(),
        end < monthEnd ? end.getDate() : monthEnd.getDate()
      );

      console.log(`✅ Adding project to timeline: ${schedule.projects.name} (days ${startDay}-${endDay})`);

      timelineProjects.push({
        title: schedule.projects.name,
        type: 4,
        startDate: startDay,
        endDate: endDay,
        season: seasonName,
        seasonColor: "#3b82f6",
        crossMonth: end > monthEnd,
        id: `proj-${schedule.id}`,
        avatars: [],
      });
    });

    console.log(`🎯 Total timeline projects to display: ${timelineProjects.length}`);
    projectItems.value = calculateNonOverlappingPositions(timelineProjects);
    console.log("✨ Final projectItems:", projectItems.value);
  };

  interface ProjectItem {
    id: string;
    title: string;
    type: 1 | 2 | 3 | 4;
    startDate: number; // day of month
    endDate: number; // day of month
    avatars: string[];
    crossMonth?: boolean; // Indicates if this project spans multiple months
    season?: string; // Season/curriculum context
    seasonColor?: string; // Visual indicator for season
  }

  // Global project templates that can be updated with real data
  const projectTemplates: Record<
    string,
    Array<{
      title: string;
      type: 1 | 2 | 3 | 4;
      startDate: number;
      endDate: number;
      crossMonth?: boolean;
      season?: string;
      seasonColor?: string;
    }>
  > = {
    // Default fallback data - will be replaced by real data
    "2025-08": [
      {
        title: "Loading...",
        type: 1,
        startDate: 4,
        endDate: 9,
        season: "Loading...",
        seasonColor: "#3b82f6",
      },
    ],
  };

  // Function to add seasons array to timeline (for overview mode without season filter)
  const addSeasonsToTimeline = async (
    seasons: Array<{ id: any; name: string; start_date: string; end_date: string }>
  ) => {
    console.log("🌟 addSeasonsToTimeline called with", seasons.length, "seasons");
    const timelineProjects: Record<string, any[]> = {};

    // Group seasons by base name (e.g., "Season 03") to consolidate specializations
    const groupedSeasons = groupSeasonsByBaseName(seasons);
    console.log("📚 Grouped seasons:", groupedSeasons);

    for (const seasonGroup of groupedSeasons) {
      const startDate = new Date(seasonGroup.start_date);
      const endDate = new Date(seasonGroup.end_date);

      console.log(`🔄 Processing season group: ${seasonGroup.displayName}`, {
        seasonStart: seasonGroup.start_date,
        seasonEnd: seasonGroup.end_date,
        specializations: seasonGroup.specializations,
        ids: seasonGroup.ids,
      });

      // For each season, fetch its projects from program_cohort_season_projects
      for (const seasonId of seasonGroup.ids) {
        console.log(`  🔍 Fetching projects for seasonId: ${seasonId}`);

        // Get program_cohort_season_id
        const { data: pcsData, error: pcsError } = await supabase
          .from("program_cohort_seasons")
          .select("id")
          .eq("season_id", seasonId)
          .eq("cohort_id", studentCohortId.value)
          .eq("program_id", studentProgramId.value)
          .maybeSingle();

        console.log(`    🔗 PCS lookup result:`, { pcsData, pcsError });

        if (!pcsData) {
          console.log(`    ⏭️ No program_cohort_season found, skipping`);
          continue;
        }

        console.log(`    ✅ Found program_cohort_season_id: ${pcsData.id}`);

        // Fetch projects for this season
        const { data: projectSchedules, error: projError } = await supabase
          .from("program_cohort_season_projects")
          .select(`
            id,
            start_date,
            end_date,
            projects!inner (
              id,
              name,
              description
            )
          `)
          .eq("program_cohort_season_id", pcsData.id);

        console.log(`    📦 Project schedules result:`, { count: projectSchedules?.length || 0, projError });

        if (!projectSchedules || projectSchedules.length === 0) {
          console.log(`    ⚠️ No projects found for this season`);
          continue;
        }

        // Add each project to the appropriate month(s)
        console.log(`    📝 Processing ${projectSchedules.length} projects`);
        projectSchedules.forEach((schedule: any) => {
          const projStart = new Date(schedule.start_date);
          const projEnd = new Date(schedule.end_date);

          console.log(`      📌 Project: ${schedule.projects.name} (${schedule.start_date} to ${schedule.end_date})`);

          // Create entries for each month this project spans
          let currentMonth = new Date(projStart.getFullYear(), projStart.getMonth(), 1);
          const lastMonth = new Date(projEnd.getFullYear(), projEnd.getMonth(), 1);

          while (currentMonth <= lastMonth) {
            const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;

            if (!timelineProjects[monthKey]) {
              timelineProjects[monthKey] = [];
            }

            const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

            const itemStartInMonth = Math.max(projStart.getTime(), monthStart.getTime());
            const itemEndInMonth = Math.min(projEnd.getTime(), monthEnd.getTime());

            const startDay = new Date(itemStartInMonth).getDate();
            const endDay = new Date(itemEndInMonth).getDate();
            const crossMonth = projEnd > monthEnd;

            console.log(`        ➕ Adding to month ${monthKey}: days ${startDay}-${endDay}`);

            timelineProjects[monthKey].push({
              title: schedule.projects.name,
              type: 4,
              startDate: startDay,
              endDate: endDay,
              crossMonth: crossMonth,
              season: seasonGroup.baseName,
              seasonColor: getSeasonColorByIndex(groupedSeasons.indexOf(seasonGroup)),
              id: `proj-${schedule.id}-${monthKey}`,
            });

            // Move to next month
            currentMonth.setMonth(currentMonth.getMonth() + 1);
          }
        });
      }
    }

    console.log("✅ Generated timeline projects from actual dates:", timelineProjects);
    console.log(`📊 Total months with projects: ${Object.keys(timelineProjects).length}`);

    // Clear existing templates and update with real data
    Object.keys(projectTemplates).forEach((key) => {
      delete projectTemplates[key];
    });
    Object.assign(projectTemplates, timelineProjects);

    console.log("🔄 Reloading current month view");
    // Reload current month view to show new data
    loadProjectsForCurrentMonth();
  };

  const todayLinePosition = computed(() => {
    const todayDate = new Date();
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    if (todayDate.getFullYear() === year && todayDate.getMonth() === month) {
      // 0-based index, so subtract 1
      return (todayDate.getDate() - 1) * columnWidth.value;
    }
    return null;
  });

  // Helper function to group seasons by base name and consolidate specializations
  const groupSeasonsByBaseName = (
    seasons: Array<{ id: any; name: string; start_date: string; end_date: string }>
  ) => {
    const seasonGroups: Map<
      string,
      {
        baseName: string;
        displayName: string;
        specializations: string[];
        start_date: string;
        end_date: string;
        ids: any[];
      }
    > = new Map();

    seasons.forEach((season) => {
      // Extract base season name and specialization
      const seasonInfo = extractSeasonInfo(season.name);

      if (seasonGroups.has(seasonInfo.baseName)) {
        // Add specialization to existing group
        const group = seasonGroups.get(seasonInfo.baseName)!;
        if (
          seasonInfo.specialization &&
          !group.specializations.includes(seasonInfo.specialization)
        ) {
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
          ids: [season.id],
        });
      }
    });

    // Create final display names with specializations
    return Array.from(seasonGroups.values()).map((group) => ({
      ...group,
      displayName:
        group.specializations.length > 0
          ? `${group.baseName} (${group.specializations.join(", ")})`
          : group.baseName,
    }));
  };

  // Helper function to extract season base name and specialization
  const extractSeasonInfo = (seasonName: string) => {
    // Pattern matching for different season formats
    const patterns = [
      // "Season 03 Software Engineer Cpp" -> base: "Season 03 Software Engineer", specialization: "Cpp"
      {
        regex: /^(Season \d+ Software Engineer)\s+(Cpp|Go|Rust)$/i,
        baseGroup: 1,
        specializationGroup: 2,
      },
      // "Season 03 Machine Learning Python" -> base: "Season 03 Machine Learning", specialization: "Python"
      {
        regex: /^(Season \d+ Machine Learning)\s+(Python|R|TensorFlow)$/i,
        baseGroup: 1,
        specializationGroup: 2,
      },
      // "Season 02 Data Science Advanced" -> base: "Season 02 Data Science", specialization: "Advanced"
      {
        regex: /^(Season \d+ Data Science)\s+(Advanced|Basic|Intermediate)$/i,
        baseGroup: 1,
        specializationGroup: 2,
      },
    ];

    for (const pattern of patterns) {
      const match = seasonName.match(pattern.regex);
      if (match) {
        return {
          baseName: match[pattern.baseGroup],
          specialization: match[pattern.specializationGroup],
        };
      }
    }

    // If no specialization pattern matches, return the full name as base
    return {
      baseName: seasonName,
      specialization: null,
    };
  };

  // Helper function to get season colors by index
  const getSeasonColorByIndex = (index: number) => {
    const colors = [
      "#3b82f6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
      "#84cc16",
    ];
    return colors[index % colors.length];
  };

  // Function to generate projects for a given month/year
  const generateProjectsForMonth = (year: number, month: number) => {
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
    return projectTemplates[monthKey] || [];
  };

  // Function to load projects for current view
  const loadProjectsForCurrentMonth = () => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    console.log(`📆 loadProjectsForCurrentMonth: ${monthKey}`);

    const projects = generateProjectsForMonth(year, month);
    console.log(`📋 Generated projects for ${monthKey}:`, projects);

    const processedProjects = calculateNonOverlappingPositions(projects);
    console.log(`🎨 Processed projects (with positions):`, processedProjects);

    projectItems.value = processedProjects.map((project: any, index: number) => ({
      ...project,
      id: `${year}-${month}-${index}`,
      avatars: ["/avatar1.jpg", "/avatar2.jpg"], // Default avatars
    }));

    console.log(`✨ Final projectItems.value (${projectItems.value.length} items):`, projectItems.value);
  };

  // Function to calculate non-overlapping positions for timeline items
  const calculateNonOverlappingPositions = (projects: any[]) => {
    if (!projects.length) return projects;

    // Sort projects by start date to process them in order
    const sortedProjects = [...projects].sort((a, b) => a.startDate - b.startDate);

    // Track occupied rows and their end positions
    const occupiedRows: Array<{ endDate: number; row: number }> = [];

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
      if (
        assignedRow === 0 ||
        !occupiedRows.find((row) => row.row === assignedRow && row.endDate < project.startDate - 1)
      ) {
        assignedRow = occupiedRows.length;
        occupiedRows.push({
          endDate: project.endDate,
          row: assignedRow,
        });
      }

      return {
        ...project,
        calculatedRow: assignedRow, // Add calculated row for positioning
      };
    });
  };

  // Computed properties
  const daysInMonth = computed(() => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  });

  const columnWidth = computed(() => {
    return Math.max(60, (zoomLevel.value / 100) * 80);
  });

  const timelineWidth = computed(() => {
    return daysInMonth.value.length * columnWidth.value;
  });

  const dynamicTimelineHeight = computed(() => {
    if (!projectItems.value.length) return 364; // Default height

    // Find the maximum row used
    const maxRow = Math.max(
      ...projectItems.value.map((item) => (item as any).calculatedRow || 0),
      0
    );

    const baseRowHeight = 64;
    const startOffset = 16;
    const bottomPadding = 20;

    return startOffset + (maxRow + 1) * baseRowHeight + bottomPadding;
  });

  // Methods
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const getDayOfWeek = (day: number) => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const date = new Date(year, month, day);
    return date.toLocaleDateString("en-US", { weekday: "narrow" });
  };

  const isToday = (day: number) => {
    const today = new Date();
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();

    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const isWeekend = (day: number) => {
    const year = currentDate.value.getFullYear();
    const month = currentDate.value.getMonth();
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  };

  const getItemStyle = (item: ProjectItem) => {
    const startPosition = (item.startDate - 1) * columnWidth.value;
    const duration = item.endDate - item.startDate + 1;
    const itemWidth = duration * columnWidth.value;

    // Use calculated row for vertical positioning, with fallback to type-based positioning
    const baseRowHeight = 64; // Height of each row (56px item + 8px gap)
    const startOffset = 16; // Starting offset from top

    const calculatedRow = (item as any).calculatedRow;
    const verticalPosition =
      calculatedRow !== undefined
        ? startOffset + calculatedRow * baseRowHeight
        : getTypeBasedPosition(item.type);

    return {
      left: `${startPosition}px`,
      width: `${itemWidth}px`,
      top: `${verticalPosition}px`,
    };
  };

  // Fallback function for type-based positioning (when calculated row is not available)
  const getTypeBasedPosition = (type: number) => {
    const positions: Record<number, number> = {
      1: 16, // Season 01 / Early projects
      2: 80, // Season 02 / Intermediate projects
      3: 144, // Season 03 / Advanced projects
      4: 208, // Specialized seasons (ML, Data Science, etc.)
    };
    return positions[type] || 16;
  };

  const getItemClasses = (type: number) => {
    const classes: Record<number, string> = {
      1: "h-8 w-1.5 bg-blue-600 rounded-md",
      2: "h-8 w-1.5 bg-green-600 rounded-md",
      3: "h-8 w-1.5 bg-yellow-600 rounded-md",
      4: "h-8 w-1.5 bg-red-600 rounded-md",
    };
    return classes[type] || "h-8 w-1.5 bg-gray-600 rounded-md";
  };

  // Convert season name to initials
  const getSeasonInitials = (seasonName: string) => {
    if (!seasonName) return "";

    // Handle different season patterns
    const patterns = [
      // Season 01 Arc 01 -> S1A1
      {
        regex: /Season (\d+) Arc (\d+)/i,
        format: (match: RegExpMatchArray) => `S${match[1]}A${match[2]}`,
      },
      // Season 02 Software Engineer -> S2
      {
        regex: /Season (\d+) Software Engineer/i,
        format: (match: RegExpMatchArray) => `S${match[1]}`,
      },
      // Season 03 Software Engineer Cpp -> S3C++
      {
        regex: /Season (\d+) Software Engineer Cpp/i,
        format: (match: RegExpMatchArray) => `S${match[1]}C++`,
      },
      // Season 03 Software Engineer Rust -> S3R
      {
        regex: /Season (\d+) Software Engineer Rust/i,
        format: (match: RegExpMatchArray) => `S${match[1]}R`,
      },
      // Season 03 Software Engineer Go -> S3Go
      {
        regex: /Season (\d+) Software Engineer Go/i,
        format: (match: RegExpMatchArray) => `S${match[1]}Go`,
      },
      // Season 03 Machine Learning -> S3ML
      {
        regex: /Season (\d+) Machine Learning/i,
        format: (match: RegExpMatchArray) => `S${match[1]}ML`,
      },
      // Season 02 Data Science -> S2DS
      {
        regex: /Season (\d+) Data Science/i,
        format: (match: RegExpMatchArray) => `S${match[1]}DS`,
      },
      // Generic Season XX -> SXX
      { regex: /Season (\d+)/i, format: (match: RegExpMatchArray) => `S${match[1]}` },
      // Preseason Data -> PD
      { regex: /Preseason Data/i, format: () => "PD" },
      // Preseason Web -> PW
      { regex: /Preseason Web/i, format: () => "PW" },
    ];

    for (const pattern of patterns) {
      const match = seasonName.match(pattern.regex);
      if (match) {
        return pattern.format(match);
      }
    }

    // Fallback: take first letter of each word
    return seasonName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 4); // Limit to 4 characters
  };

  const previousMonth = () => {
    const newDate = new Date(currentDate.value);
    newDate.setMonth(newDate.getMonth() - 1);
    // Restrict to allowedStartDate
    if (
      allowedStartDate.value &&
      (newDate.getFullYear() < allowedStartDate.value.getFullYear() ||
        (newDate.getFullYear() === allowedStartDate.value.getFullYear() &&
          newDate.getMonth() < allowedStartDate.value.getMonth()))
    ) {
      return;
    }
    currentDate.value = newDate;
    const lastday = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    scrollToDay(lastday);
    if (selectedSeasonId.value) {
      loadProjectsForSeason(selectedSeasonId.value);
    } else {
      loadProjectsForCurrentMonth();
    }
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate.value);
    newDate.setMonth(newDate.getMonth() + 1);
    // Restrict to allowedEndDate
    if (
      allowedEndDate.value &&
      (newDate.getFullYear() > allowedEndDate.value.getFullYear() ||
        (newDate.getFullYear() === allowedEndDate.value.getFullYear() &&
          newDate.getMonth() > allowedEndDate.value.getMonth()))
    ) {
      return;
    }
    currentDate.value = newDate;
    scrollToDay(1);

    if (selectedSeasonId.value) {
      loadProjectsForSeason(selectedSeasonId.value);
    } else {
      loadProjectsForCurrentMonth();
    }
  };

  // Method to add new project items (for future use)
  const addProjectItem = (item: Omit<ProjectItem, "id">) => {
    const newItem: ProjectItem = {
      ...item,
      id: Date.now().toString(),
    };
    projectItems.value.push(newItem);
  };

  const supabase = useSupabaseClient();

  const loadSeasonDeadlines = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // First, get the student's cohort ID
    const { data: student, error: studentError } = await supabase
      .from("students")
      .select("cohort_id, program_id")
      .eq("email", session?.user?.email ?? "")
      .single<{ cohort_id: string; program_id: string }>();

    if (student) {
      studentProgramId.value = student.program_id;
      studentCohortId.value = student.cohort_id;
    }

    // fetch seasons for dropdown seasons
    const { data: seasonsList, error: seasonsError } = await supabase
      .from("seasons")
      .select("id, name, order_in_program")
      .eq("program_id", studentProgramId.value ?? "");

    if (seasonsList) {
      type SeasonListItem = { id: string | number; name: string; order_in_program?: number };
      const typedSeasonsList = seasonsList as SeasonListItem[];
      const sortedSeasons = [...typedSeasonsList].sort(
        (a, b) => (a.order_in_program ?? 0) - (b.order_in_program ?? 0)
      );
      // Remove the first season from the list
      // Remove the first season from the list
      const filteredSeasons = sortedSeasons.slice(1);
      filteredSeasons.pop();

      studentSeasons.value = filteredSeasons.map((season) => {
        // If the name starts with "Season XX Software Engineer", remove "Software Engineer" and trim
        let label = season.name;
        const match = label.match(/^(Season \d+)\s+Software Engineer\s*(.*)$/i);
        if (match) {
          // If there is a specialization (Cpp, Rust, Go), append it; otherwise, just "Season XX"
          label = match[2] ? `${match[1]} ${match[2]}`.trim() : match[1];
        }
        return {
          label,
          value: String(season.id),
        };
      });
      console.log("Student seasons:", studentSeasons.value);
    }

    // Now, use the cohort ID to query program_cohort_seasons
    const { data: seasonsProgress, error: progressError } = await supabase
      .from("program_cohort_seasons")
      .select(
        `
        start_date,
        end_date,
        cohort_id,
        seasons!inner (
          id,
          name,
          program_id
        )
      `
      )
      .eq("cohort_id", (student as any)?.cohort_id)
      .eq("program_id", (student as any)?.program_id)
      .order("start_date", { ascending: true, nullsFirst: false }); // Filter by the cohort ID you just fetched

    const seasons = seasonsProgress?.map((season: any) => ({
      id: season.seasons.id,
      name: season.seasons.name,
      start_date: season.start_date,
      end_date: season.end_date,
      type: 2,
    }));

    cohortSeasonsDeadlines.value = seasons || [];
    console.log("Cohort season deadlines:", cohortSeasonsDeadlines.value);

    // Process seasons and add to timeline using actual project dates
    if (seasons) {
      await addSeasonsToTimeline(seasons);
    }
  };

  // Keyboard navigation
  onMounted(() => {
    // Load projects for the initial month
    loadProjectsForCurrentMonth();
    loadSeasonDeadlines();

    const handleKeydown = (event: KeyboardEvent) => {
      if (!timelineContainer.value) return;

      const scrollAmount = columnWidth.value * 2;

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        timelineContainer.value.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        timelineContainer.value.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKeydown);

    onUnmounted(() => {
      window.removeEventListener("keydown", handleKeydown);
    });
  });
</script>

<style scoped>
  .timeline {
    scrollbar-width: 6px;
    scrollbar-color: #c2c2c2a2 transparent;
  }
</style>
