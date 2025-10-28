<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import * as z from 'zod'

definePageMeta({
    layout: "default",
    middleware: ["admin"],
});

const toast = useToast()
const supabase = useSupabaseClient()

// Form state
const selectedProgram = ref<string | null>(null)
const selectedCohort = ref<string | null>(null)
const selectedSeasons = ref<string[]>([])
const startDate = ref<string>('')
const endDate = ref<string>('')

// Data arrays
const programs = ref<any[]>([])
const cohorts = ref<any[]>([])
const seasons = ref<any[]>([])
const loading = ref(false)

// Dropdown options
const programOptions = computed(() =>
    programs.value.map(p => ({
        label: p.name,
        value: p.id
    }))
)

const cohortOptions = computed(() =>
    cohorts.value.map(c => ({
        label: c.name,
        value: c.id
    }))
)

const seasonOptions = computed(() =>
    seasons.value.map(s => ({
        label: s.name,
        value: s.id
    }))
)

// Zod validation schema
const schema = z.object({
    program: z.string().min(1, 'Program is required'),
    cohort: z.string().min(1, 'Cohort is required'),
    seasons: z.array(z.string()).min(1, 'At least one season is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
})

type Schema = z.output<typeof schema>

const state = ref<Schema>({
    program: '',
    cohort: '',
    seasons: [],
    startDate: '',
    endDate: '',
})

// Fetch programs
async function fetchPrograms() {
    try {
        const response = await $fetch('/api/programs')
        programs.value = response?.data || []
        console.log('Programs loaded:', programs.value)
    } catch (err) {
        console.error('Error fetching programs:', err)
        toast.add({
            title: 'Error',
            description: 'Failed to fetch programs',
            color: 'error',
            icon: 'i-lucide-alert-circle',
        })
    }
}

// Fetch cohorts filtered by program
async function fetchCohortsByProgram(programId: string) {
    try {
        const { data, error } = await supabase
            .from('cohorts')
            .select('id, name, program_id')
            .eq('program_id', programId)
            .order('name', { ascending: true })

        if (error) throw error
        console.log('Fetched cohorts:', data)
        cohorts.value = data || []

        // Reset cohort selection if it's no longer valid
        if (selectedCohort.value && !cohorts.value.find(c => c.id === selectedCohort.value)) {
            selectedCohort.value = null
            state.value.cohort = ''
        }
    } catch (err) {
        console.error('Error fetching cohorts:', err)
        toast.add({
            title: 'Error',
            description: 'Failed to fetch cohorts',
            color: 'error',
            icon: 'i-lucide-alert-circle',
        })
    }
}

// Fetch seasons filtered by program
async function fetchSeasonsByProgram(programId: string) {
    try {
        // Get seasons for the selected program through program_cohort_seasons
        const { data, error } = await supabase
            .from('program_cohort_seasons')
            .select(`
                season_id,
                seasons (
                    id,
                    name
                )
            `)
            .eq('program_id', programId)

        if (error) throw error

        // Extract unique seasons (avoid duplicates)
        const uniqueSeasons = new Map()
        data?.forEach((item: any) => {
            if (item.seasons) {
                uniqueSeasons.set(item.seasons.id, {
                    id: item.seasons.id,
                    name: item.seasons.name
                })
            }
        })

        seasons.value = Array.from(uniqueSeasons.values())

        // Reset season selection if any selected seasons are no longer valid
        if (selectedSeasons.value.length > 0) {
            selectedSeasons.value = selectedSeasons.value.filter(seasonId =>
                seasons.value.find(s => s.id === seasonId)
            )
            state.value.seasons = selectedSeasons.value
        }
    } catch (err) {
        console.error('Error fetching seasons:', err)
        toast.add({
            title: 'Error',
            description: 'Failed to fetch seasons',
            color: 'error',
            icon: 'i-lucide-alert-circle',
        })
    }
}

// Watch for program selection changes
watch(selectedProgram, async (newProgramId) => {
    if (newProgramId) {
        await fetchCohortsByProgram(newProgramId)
        await fetchSeasonsByProgram(newProgramId)
        state.value.program = newProgramId
    } else {
        cohorts.value = []
        seasons.value = []
        selectedCohort.value = null
        selectedSeasons.value = []
        state.value.cohort = ''
        state.value.seasons = []
    }
})

// Watch for other selections
watch(selectedCohort, (newCohortId) => {
    state.value.cohort = newCohortId || ''
})

watch(selectedSeasons, (newSeasonIds) => {
    state.value.seasons = newSeasonIds || []
})

watch(startDate, (newDate) => {
    state.value.startDate = newDate
})

watch(endDate, (newDate) => {
    state.value.endDate = newDate
})

// Form submission
async function onSubmit() {
    loading.value = true

    try {
        // Validate form
        if (!selectedProgram.value) {
            throw new Error('Please select a program')
        }
        if (!selectedCohort.value) {
            throw new Error('Please select a cohort')
        }
        if (!selectedSeasons.value || selectedSeasons.value.length === 0) {
            throw new Error('Please select at least one season')
        }
        if (!startDate.value) {
            throw new Error('Please enter a start date')
        }
        if (!endDate.value) {
            throw new Error('Please enter an end date')
        }

        // Validate dates
        if (new Date(endDate.value) <= new Date(startDate.value)) {
            throw new Error('End date must be after start date')
        }

        // Create an entry for each selected season
        const promises = selectedSeasons.value.map(seasonId =>
            $fetch('/api/program-cohort-seasons/create', {
                method: 'POST',
                body: {
                    program_id: selectedProgram.value,
                    cohort_id: selectedCohort.value,
                    season_id: seasonId,
                    start_date: startDate.value,
                    end_date: endDate.value,
                }
            })
        )

        // Wait for all seasons to be created
        const results = await Promise.allSettled(promises)

        // Check for any failures
        const failures = results.filter(r => r.status === 'rejected')
        const successes = results.filter(r => r.status === 'fulfilled')

        if (failures.length > 0 && successes.length === 0) {
            throw new Error('Failed to create all seasons')
        }

        if (failures.length > 0) {
            toast.add({
                title: 'Partial Success',
                description: `${successes.length} season(s) created successfully, ${failures.length} failed`,
                color: 'warning',
                icon: 'i-lucide-alert-triangle',
            })
        } else {
            toast.add({
                title: 'Success',
                description: `${successes.length} season(s) created successfully for the cohort and program`,
                color: 'success',
                icon: 'i-lucide-check-circle',
            })
        }

        // Reset form
        resetForm()
    } catch (err: any) {
        console.error('Error creating program cohort season:', err)
        toast.add({
            title: 'Error',
            description: err?.data?.statusMessage || err?.message || 'Failed to create season',
            color: 'error',
            icon: 'i-lucide-alert-circle',
        })
    } finally {
        loading.value = false
    }
}

function resetForm() {
    selectedProgram.value = null
    selectedCohort.value = null
    selectedSeasons.value = []
    startDate.value = ''
    endDate.value = ''
    state.value = {
        program: '',
        cohort: '',
        seasons: [],
        startDate: '',
        endDate: '',
    }
}

// Load data on mount
onMounted(async () => {
    await fetchPrograms()
})
</script>

<template>
  <div class="mt-6 w-full lg:max-w-xl mx-auto !gap-0">
    
    <div class="flex justify-between">
        <div>
            <h1 class="text-highlighted font-medium text-left w-full">Season Management</h1>
            <p class="text-muted text-[15px] text-pretty mt-1">Manage seasons for each cohort and program.</p>
        </div>
    </div>
        
    <UCard
      variant="subtle"
      class="mt-4 flex justify-center"
      :ui="{
            body: '!py-4 w-full !px-8'
      }"
    >
        <UForm :schema="schema" :state="state" class="space-y-6" @submit="onSubmit">
        <UFormField label="Program" name="program" required>
            <USelect 
                v-model="selectedProgram"
                :items="programOptions"
                placeholder="Select a program"
                class="w-full"
            />
        </UFormField>

        <UFormField label="Cohort" name="cohort" required>
            <USelect
                v-model="selectedCohort"
                :items="cohortOptions"
                placeholder="Select a cohort"
                :disabled="!selectedProgram || cohortOptions.length === 0"
                class="w-full"
            />
            <template #hint v-if="selectedProgram && cohortOptions.length === 0">
                <span class="text-sm text-gray-500">No cohorts available for this program</span>
            </template>
        </UFormField>

        <UFormField label="Seasons" name="seasons" required>
            <USelect
                v-model="selectedSeasons"
                :items="seasonOptions"
                multiple
                placeholder="Select one or more seasons"
                class="w-full"
            />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Start Date" name="startDate" required>
                <UInput
                    v-model="startDate"
                    type="date"
                    class="w-full"
                />
            </UFormField>

            <UFormField label="End Date" name="endDate" required>
                <UInput
                    v-model="endDate"
                    type="date"
                    class="w-full"
                />
            </UFormField>
        </div>

        <div class="flex gap-3">
            <UButton
                type="submit"
                color="primary"
                 variant="soft"
                :loading="loading"
                :disabled="loading"
            >
                Create Season
            </UButton>

            <UButton
                color="neutral"
                variant="outline"
                @click="resetForm"
                :disabled="loading"
            >
                Reset
            </UButton>
        </div>
        </UForm>
    </UCard>
</div>
</template>
