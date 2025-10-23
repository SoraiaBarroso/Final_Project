<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useCohorts } from '~/composables/useCohorts'
import CohortsTable from '~/components/admin/CohortsTable.vue'
import * as z from 'zod'

definePageMeta({
    layout: "default",
    middleware: ["admin"],
});

const { cohorts, loading, error, fetchCohorts, createCohort, toggleCohortStatus } = useCohorts()
const isModalOpen = ref(false)
const toast = useToast()
const formRef = ref(null)

// Fetch programs
const programs = ref<any[]>([])
const programItems = ref(<any[]>([]))

const selectedPrograms = ref<string[]>([])
const programDates = ref<Record<string, { start_date: string; end_date: string }>>({})

const schema = z.object({
  cohortName: z.string().min(1, 'Cohort name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  meetingId: z.string().optional(),
  isActive: z.boolean(),
})

type Schema = z.output<typeof schema>

const state = ref<Schema>({
  cohortName: '',
  startDate: '',
  endDate: '',
  meetingId: '',
  isActive: true,
})

async function fetchPrograms() {
  try {
    const response = await $fetch('/api/programs')
    programs.value = response?.data || []
    programItems.value = programs.value.map((program: any) => ({
      label: program.name,
      value: program.id,
    }))
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

onMounted(async () => {
  await fetchCohorts()
  await fetchPrograms()
  console.log('Programs fetched:', programs.value)
  console.log('Cohorts fetched:', cohorts.value)
})

function openModal() {
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  // Reset form on close
  state.value = {
    cohortName: '',
    startDate: '',
    endDate: '',
    meetingId: '',
    isActive: true,
  }
  selectedPrograms.value = []
  programDates.value = {}
}

async function handleToggleStatus({ cohortName, isActive }: { cohortName: string, isActive: boolean }) {
  try {
    const response = await toggleCohortStatus(cohortName, isActive)

    toast.add({
      title: 'Success',
      description: response.message || `Cohort ${isActive ? 'activated' : 'deactivated'} successfully`,
      color: 'success',
      icon: 'i-lucide-check-circle',
    })
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.data?.statusMessage || 'Failed to update cohort status',
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
  }
}

const submitForm = async () => {
  try {
    // basic client-side validation
    if (!state.value.cohortName) throw new Error('Cohort name is required')
    if (!state.value.startDate) throw new Error('Start date is required')
    if (!state.value.endDate) throw new Error('End date is required')
    if (!selectedPrograms.value || selectedPrograms.value.length === 0) throw new Error('Select at least one program')

    // Extract program IDs from the selected objects
    const programsPayload = selectedPrograms.value.map((item: any) => {
      // Handle both string IDs and objects with value property
      const programId = typeof item === 'string' ? item : item.value
      return {
        program_id: programId,
        start_date: state.value.startDate,
        end_date: state.value.endDate,
      }
    })

    const payload = {
      name: state.value.cohortName,
      meeting_id: state.value.meetingId || undefined,
      is_active: state.value.isActive,
      programs: programsPayload,
    }

    console.log('Creating cohort with payload:', payload)
    const response = await createCohort(payload)

    toast.add({
      title: 'Cohort created',
      description: 'Cohort(s) created successfully',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    // refresh cohorts and close modal
    await fetchCohorts()
    closeModal()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err?.message || err?.data?.statusMessage || 'Failed to create cohort',
      color: 'error',
      icon: 'i-lucide-x-circle',
    })
    throw err
  }
}
</script>

<template>
    <UDashboardPanel id="cohorts">
        <template #header>
            <UDashboardNavbar title="Cohorts" >
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
              <!-- Stats Card -->
              <StudentStatCard
                title="Total Cohorts"
                :count="cohorts.length"
                icon="i-lucide-users"
                icon-color="info"
                rounded-class="rounded-lg"
              />
            
              <div class="flex justify-end mb-4">
                <UButton
                  label="Add Cohort"
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-plus"
                  class="w-fit"
                  @click="openModal"
                />
              </div>

              <UModal
                v-model:open="isModalOpen"
                title="Create New Cohort"
                description="Add new cohort details below"
                :ui="{
                  content: 'sm:max-w-2xl',
                  body: 'p-6',
                  footer: 'flex justify-end gap-2 p-4'
                }"
              >
                <template #body>
                  <UForm ref="formRef" :schema="schema" :state="state" class="space-y-6 px-10">
                    <UFormField label="Cohort Name" name="cohortName" description="e.g., Sep 24, Mar 25" required>
                      <UInput v-model="state.cohortName" placeholder="e.g., Sep 24" class="w-full"/>
                    </UFormField>

                    <UFormField label="Programs" description="Select programs for this cohort" required>
                      <USelectMenu
                        v-model="selectedPrograms"
                        multiple 
                        :items="programItems"  
                        placeholder="Select programs"
                        class="w-full"
                      />
                    </UFormField>

                    <UFormField label="Meeting ID" name="meetingId" description="Optional meeting ID for cohort sessions">
                      <UInput v-model="state.meetingId" placeholder="Enter meeting ID" class="w-full"/>
                    </UFormField>

                    <div class="flex gap-4 w-full">
                      <UFormField label="Start Date" name="startDate" description="Cohort start date" required class="w-full">
                        <UInput
                          v-model="state.startDate"
                          type="date"
                          class="w-full"
                        />
                      </UFormField>

                      <UFormField label="End Date" name="endDate" description="Cohort end date" required class="w-full">
                        <UInput
                          v-model="state.endDate"
                          type="date"
                          class="w-full"
                        />
                      </UFormField>
                    </div>
              
                    <UFormField label="Active Status" name="isActive" description="Set cohort as active or inactive">
                      <div class="flex items-center gap-2">
                        <USwitch v-model="state.isActive" />
                        <span class="text-sm">{{ state.isActive ? 'Active' : 'Inactive' }}</span>
                      </div>
                    </UFormField>
                  </UForm>
                </template>

                <template #footer="{ close }">
                  <UButton label="Cancel" color="neutral" variant="outline" @click="close" />
                  <UButton label="Create Cohort" color="success" icon="i-lucide-plus" @click="submitForm" :loading="loading" />
                </template>
              </UModal>
              <!-- Cohorts Table -->
              <CohortsTable :data="cohorts" :loading="loading" @toggle-status="handleToggleStatus" />
        </template>
    </UDashboardPanel>
</template>