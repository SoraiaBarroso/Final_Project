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
    
    // Get student season progress
    const { data: progressData, error: progressError } = await supabase
      .from('student_season_progress')
      .select('*')
      .eq('student_id', studentData.id);

    if (progressError) throw progressError;
    console.log('Progress Data:', progressData);

    // Merge data
    seasons.value = cohortSeasons.map((season) => {
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
      <UDashboardNavbar title="My Roadmap">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <USkeleton class="h-12 w-12" :ui="{ rounded: 'rounded-full' }" />
        </div>

        <!-- Seasons Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <UCard
            v-for="(season, index) in seasons"
            :key="season.id"
            class="overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <!-- Header with random color -->
            <template #header>
              <div :class="[getSeasonColor(index), 'p-4 -m-4 mb-4']">
                <div class="flex items-center justify-between">
                  <h3 class="text-white font-bold text-lg">{{ season.name }}</h3>
                  <UBadge
                    v-if="season.is_completed"
                    color="white"
                    variant="solid"
                    size="xs"
                  >
                    Completed
                  </UBadge>
                </div>
              </div>
            </template>

            <!-- Body -->
            <div class="space-y-4">
              <!-- Progress Bar -->
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                  <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {{ parseFloat(season.progress_percentage).toFixed(0) }}%
                  </span>
                </div>
                <UProgress
                  :value="parseFloat(season.progress_percentage)"
                  :max="100"
                  size="md"
                  :color="season.is_completed ? 'green' : 'primary'"
                />
              </div>

              <!-- Dates -->
              <div class="space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Start Date:</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {{ formatDate(season.start_date) }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600 dark:text-gray-400">End Date:</span>
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {{ formatDate(season.end_date) }}
                  </span>
                </div>
                <div v-if="season.is_completed && season.completion_date" class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span class="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span class="font-medium text-green-600 dark:text-green-400">
                    {{ formatDate(season.completion_date) }}
                  </span>
                </div>
              </div>

              <!-- Description (if available) -->
              <p v-if="season.description" class="text-sm text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                {{ season.description }}
              </p>
            </div>
          </UCard>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && seasons.length === 0" class="text-center py-12">
          <p class="text-gray-500 dark:text-gray-400">No seasons found for your program.</p>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>