<script setup>
import { ref, computed, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const props = defineProps({
  seasonId: { type: String, required: true },
  programId: { type: String, required: true },
  cohortId: { type: String, required: true },
})

const supabase = useSupabaseClient()
const projects = ref([])
const season = ref(null)
const today = new Date()

const upcomingProjects = computed(() => {
  if (!season.value || !season.value[0]) return []
  const seasonStart = new Date(season.value[0].start_date)
  // Map projects with deadline and start
  const mapped = projects.value.map(project => {
    const offset = Number(project.offset_days) || 0
    const duration = Number(project.duration_days) || 1
    const deadline = new Date(seasonStart)
    deadline.setDate(seasonStart.getDate() + offset + duration - 1)
    const start = new Date(seasonStart)
    start.setDate(seasonStart.getDate() + offset)
    return { ...project, deadline, start }
  })

  // Group all projects with 'bootcamp' in the description (case-insensitive)
  const bootcampGroup = mapped.filter(p => p.description && p.description.toLowerCase().includes('bootcamp'))
  let groups = []
  if (bootcampGroup.length > 0) {
    const minStart = bootcampGroup.reduce((min, p) => p.start < min ? p.start : min, bootcampGroup[0].start)
    const totalDuration = bootcampGroup.reduce((sum, p) => sum + (Number(p.duration_days) || 1), 0)
    const groupDeadline = new Date(minStart)
    groupDeadline.setDate(minStart.getDate() + totalDuration - 1)
    if (today <= groupDeadline) {
      groups.push({
        id: 'bootcamp-group',
        name: bootcampGroup[0].description,
        deadline: groupDeadline,
        isGroup: true,
        projects: bootcampGroup
      })
    }
  }
  // Add all other projects that are not in the bootcamp group and are upcoming
  groups = groups.concat(
    mapped.filter(p =>
      !(p.description && p.description.toLowerCase().includes('bootcamp')) && today <= p.deadline
    )
  )
  // Sort by closest deadline to today
  return groups.sort((a, b) => a.deadline - b.deadline).slice(0, 2)
})

const seasonDeadline = computed(() => {
  if (!season.value || !season.value[0]) return null
  return new Date(season.value[0].end_date)
})

const daysToSeasonDeadline = computed(() => {
  if (!seasonDeadline.value) return null
  const diff = Math.ceil((seasonDeadline.value - today) / (1000 * 60 * 60 * 24))
  return diff
})

const ready = computed(() =>
  !!props.seasonId && !!props.programId && !!props.cohortId
)

watch(ready, async (isReady) => {
  if (isReady) {
    const { data: seasonData } = await supabase
        .from('program_cohort_seasons')
        .select(`start_date, end_date, seasons!inner (
            id,
            name,
            program_id
        )`)
        .eq('cohort_id', props.cohortId)
        .eq('program_id', props.programId)
        .eq('season_id', props.seasonId)

    season.value = seasonData?.map((season) => ({
        id: season.seasons.id,
        name: season.seasons.name,
        start_date: season.start_date,
        end_date: season.end_date,
    }));

    // Fetch projects for this season and program
    const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('season_id', props.seasonId)
        .eq('program_id', props.programId)

    projects.value = Array.isArray(projectData) ? projectData : []
    console.log("Fetched projects:", projects.value, error)
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col mt-6">
    
    <div class="flex gap-4">

        <template v-if="upcomingProjects.length > 0">
            <UCard v-for="(project, idx) in upcomingProjects" :key="project.id"
                :class="['w-full', idx === 0 ? 'bg-[#E3F2FD]' : 'bg-[#B2DFDB]']"
                variant="none"
                :ui="{
                    body: 'xl:!px-4 xl:!py-4 2xl:!py-3 2xl:!px-5 flex flex-col items-start w-full h-34'
                }"
            >
                <h3 :class="['font-semibold 2xl:text-xl', idx === 0 ? 'text-[#0D47A1]' : 'text-[#004D40]']">{{ project.name }}</h3>
                <p :class="['text-sm pt-1', idx === 0 ? 'text-[#0D47A1]' : 'text-[#004D40]']">{{ project.deadline.toLocaleDateString() }}</p>
                <p :class="['font-semibold text-xl mt-6 ml-auto', idx === 0 ? 'text-[#0D47A1]' : 'text-[#004D40]']">{{ Math.max(0, Math.ceil((project.deadline - today) / (1000 * 60 * 60 * 24))) }} days</p>
            </UCard>
        </template>

        <template v-else>
            <UCard class=" bg-white flex items-center justify-center w-full h-34">
                <div class="bg-elevated/60 w-14 h-14 m-auto rounded-full flex justify-center items-center mb-4">
                    <UIcon name="emojione:file-cabinet" class="w-8 h-8" />
                </div>
                <p class="text-gray-500 text-center ">No upcoming project</p>
            </UCard>
            <UCard class=" bg-white flex items-center justify-center w-full h-34">
                <div class="bg-elevated/60 w-14 h-14 m-auto rounded-full flex justify-center items-center mb-4">
                    <UIcon name="emojione:file-cabinet" class="w-8 h-8" />
                </div>
                <p class="text-gray-500 text-center ">No upcoming project</p>
          </UCard>
        </template>

    </div>
    
    <UCard 
        class="event_card mt-4 bg-[#C5CAE9] w-full"
        variant="none"
        :ui="{
            body: 'xl:!px-4 xl:!py-4 2xl:!py-3 2xl:!px-4 flex flex-col items-start h-34'
        }"
    >
        <h3 class="font-semibold 2xl:text-xl text-[#1A237E]">{{ season && season[0]?.name || 'Season' }}</h3>
        <p v-if="seasonDeadline" class="text-sm pt-1 text-[#1A237E]">{{ seasonDeadline.toLocaleDateString() }}</p>
        <p v-if="daysToSeasonDeadline !== null" class="font-semibold text-xl text-[#1A237E] mt-6 ml-auto">{{ daysToSeasonDeadline }} days</p>
    </UCard>

  </div>
</template>

<style scoped>
.bg-gradient-to-br {
  background: linear-gradient(135deg, var(--tw-gradient-stops));
}
</style>