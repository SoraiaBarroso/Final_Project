<script setup>
import { ref, onMounted } from 'vue';

definePageMeta({
  layout: "custom",
  middleware: ["auth", "student-only"],
});

const supabase = useSupabaseClient();
const user = useSupabaseUser();

const seasons = ref([]);
const loading = ref(true);

// Array of random colors for season cards
const colors = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-cyan-500',
];

// Function to get a consistent color based on index
const getSeasonColor = (index) => {
  return colors[index % colors.length];
};

// Format date to readable format
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Fetch seasons and progress data
const fetchSeasonData = async () => {
  try {
    loading.value = true;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    // Get student's cohort
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('id, cohort_id')
      .eq('email', session?.user?.email)
      .single();

    if (studentError) throw studentError;
    console.log('Student Data:', studentData);

    // Get student season progress first to determine which Season 03 track they're in
    const { data: progressData, error: progressError } = await supabase
      .from('student_season_progress')
      .select('*, seasons(id, name)')
      .eq('student_id', studentData.id);

    if (progressError) throw progressError;
    console.log('Progress Data:', progressData);

    // Find which Season 03 specialization the student has progress in
    const season03Progress = progressData.find(p =>
      p.seasons?.name?.match(/^Season 03 Software Engineer/)
    );
    const studentSeason03Track = season03Progress?.seasons?.name;
    console.log('Student Season 03 Track:', studentSeason03Track);

    // Get program cohort seasons
    const { data: cohortSeasons, error: seasonsError } = await supabase
      .from('program_cohort_seasons')
      .select(`
        *,
        seasons (
          name
        )
      `)
      .eq('cohort_id', studentData.cohort_id)
      .order('start_date', { ascending: true });

    if (seasonsError) throw seasonsError;
    console.log('Cohort Seasons:', cohortSeasons);

    // Filter and merge data
    // Filter out Season 03 tracks that don't match the student's track
    const filteredSeasons = cohortSeasons.filter((season) => {
      const seasonName = season.seasons?.name;
      const isSeason03SE = seasonName?.match(/^Season 03 Software Engineer/);

      // If it's a Season 03 SE track, only include it if it matches the student's track
      if (isSeason03SE) {
        return studentSeason03Track && seasonName === studentSeason03Track;
      }

      // Include all other seasons
      return true;
    });

    seasons.value = filteredSeasons.map((season) => {
      const progress = progressData.find(p => p.season_id === season.season_id);
      return {
        ...season,
        name: season.seasons?.name || 'Season',
        description: season.seasons?.description || '',
        progress_percentage: progress?.progress_percentage || '0.00',
        is_completed: progress?.is_completed || false,
        completion_date: progress?.completion_date || null,
      };
    });

  } catch (error) {
    console.error('Error fetching season data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchSeasonData();
});
</script>

<template>
  <UDashboardPanel id="roadmap">
    <template #header>
      <UDashboardNavbar title="Roadmap">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <USkeleton class="h-12 w-12" :ui="{ rounded: 'rounded-full' }" />
        </div>

        <!-- Seasons Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <UCard
            v-for="(season, index) in seasons"
            :key="season.id"
            :ui="{
              header: '!p-1 border-none',
              body: '!px-4 !py-1'
            }"
            class="overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <!-- Header with random color -->
            <template #header>
              <div :class="[getSeasonColor(index), 'h-34 w-full rounded-lg flex justify-end items-start ']">
                  <UBadge
                    v-if="season.is_completed"
                    variant="solid"
                    color="neutral"
                    size="sm"
                    label="Completed"
                    class="m-2"
                  />
                  <UBadge
                    v-else
                    variant="solid"
                    color="neutral"
                    size="sm"
                    label="In Progress"
                    class="m-2"
                  />
              </div>
            </template>

            <!-- Body -->
            <div class="space-y-4">
              
              <h3 class="text-highlighted font-bold text-lg">{{ season.name }}</h3>
              
              <!-- Dates -->
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-muted">Start Date:</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {{ formatDate(season.start_date) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-muted">End Date:</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {{ formatDate(season.end_date) }}
                  </span>
                </div>
                <div v-if="season.is_completed && season.completion_date" class="flex items-center justify-between pt-2">
                  <span class="text-muted">Completition:</span>
                  <UProgress v-if="season.name !== 'Final Project'" :model-value="parseFloat(season.progress_percentage)" class="ml-6"/>
                </div>
              </div>

              <!-- Description (if available) -->
              <p v-if="season.description" class="text-sm text-muted pt-2">
                {{ season.description }}
              </p>
            </div>
          </UCard>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && seasons.length === 0" class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">No seasons found for your program.</p>
        </div>
    </template>
  </UDashboardPanel>
</template>