<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  }
})

const supabase = useSupabaseClient()
const toast = useToast()
const {cohorts, fetchCohorts} = useCohorts()
const items = ref([])
const isUpdating = ref(false)
const isModalOpen = ref(false)
const selectedCohortId = ref(null)

onMounted(async () => {
  // Fetch cohorts filtered by the student's program
  await fetchCohorts({ program_id: props.student.program_id })
  console.log("Filtered cohorts for program:", cohorts.value)

  items.value = cohorts.value.map(cohort => ({
    label: cohort.name,
    value: cohort.cohort_ids?.find(id => cohort.programs?.find(p => p.id === props.student.program_id && p.cohort_id === id))
  }))

  console.log("Dropdown items:", items.value)

  // Set initial selected cohort
  selectedCohortId.value = props.student.cohort_id
})

// Handle cohort change
const handleCohortChange = async () => {
  console.log("Selected cohort ID:", selectedCohortId.value)

  if (!selectedCohortId.value || selectedCohortId.value === props.student.cohort_id) {
    // No change needed
    isModalOpen.value = false
    return
  }

  try {
    isUpdating.value = true

    // Update student's cohort in the database
    const { error } = await supabase
      .from('students')
      .update({ cohort_id: selectedCohortId.value })
      .eq('id', props.student.id)

    if (error) throw error

    // Update the local student object
    props.student.cohort_id = selectedCohortId.value

    // Find and update the cohort name for display
    const selectedCohort = cohorts.value.find(c =>
      c.cohort_ids?.includes(selectedCohortId.value)
    )
    if (selectedCohort && props.student.cohorts) {
      props.student.cohorts.name = selectedCohort.name
    }

    toast.add({
      title: 'Success',
      description: 'Student cohort updated successfully',
      color: 'green'
    })

    // Close modal
    isModalOpen.value = false

    // Reload the page to reflect changes
    setTimeout(() => {
      window.location.reload()
    }, 1000)

  } catch (error) {
    console.error('Error updating cohort:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update student cohort',
      color: 'red'
    })
  } finally {
    isUpdating.value = false
  }
}

// Format ISO datetime to human friendly: "28 Oct, 2024 at 23:20"
const formatDateTime = (iso) => {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return null

    const day = String(d.getDate()).padStart(2, '0')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[d.getMonth()]
    const year = d.getFullYear()

    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${day} ${month}, ${year} at ${hours}:${minutes}`
  } catch (e) {
    return null
  }
}

const emit = defineEmits(['send-email', 'send-slack-message'])

const handleSendEmail = () => {
  emit('send-email', props.student)
}

const handleSendSlackMessage = () => {
  emit('send-slack-message', props.student)
}
</script>

<template>
  <UCard class="w-full max-w-md">
    <div class="flex flex-col gap-6">

      <div class="flex gap-4 items-start">
         <UAvatar
          :src="student.profile_image_url"
          :alt="`${student.first_name} ${student.last_name}`"
          class="h-16 w-16 flex-shrink-0"
        />

        <div class="flex flex-col gap-1 min-w-0">
            <h2 class="text-xl font-bold truncate">{{ student.first_name }} {{ student.last_name }}</h2>
            <p class="text-muted text-sm truncate">{{ student.email || 'N/A' }}</p>
        </div>
      </div>

        <div class="flex flex-col gap-3">
           <div class="flex gap-2">
            <p class="text-highlighted text-sm font-medium whitespace-nowrap">Username:</p>
            <p class="text-muted text-sm truncate">{{ student.username || 'N/A' }}</p>
          </div>

          <div class="flex gap-2 items-center">
            <p class="text-highlighted text-sm font-medium whitespace-nowrap">Cohort:</p>
            <p class="text-muted text-sm truncate">{{ student.cohorts?.name || 'N/A' }}</p>
            <UModal v-model:open="isModalOpen" title="Change Cohort" :ui="{ footer: 'justify-end' }" class="ml-auto">
              <UButton color="neutral" icon="i-lucide-edit" variant="soft" />

              <template #body>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Select New Cohort</label>
                    <USelect
                      v-model="selectedCohortId"
                      :items="items"
                      :disabled="isUpdating"
                      :loading="isUpdating"
                      placeholder="Select Cohort"
                      class="w-full"
                    />
                  </div>
                </div>
              </template>

              <template #footer="{ close }">
                <UButton label="Cancel" color="neutral" variant="outline" @click="close" :disabled="isUpdating" />
                <UButton
                  label="Save"
                  variant="subtle"
                  color="primary"
                  @click="handleCohortChange"
                  :loading="isUpdating"
                  :disabled="isUpdating || !selectedCohortId"
                />
              </template>
            </UModal>
          </div>
          <div class="flex gap-2">
            <p class="text-highlighted text-sm font-medium whitespace-nowrap">Program:</p>
            <p class="text-muted text-sm truncate">{{ student.programs?.name || 'N/A' }}</p>
          </div>

          <div class="flex gap-2">
            <p class="text-highlighted text-sm font-medium whitespace-nowrap">Last Activity:</p>
            <p class="text-muted text-sm">{{ formatDateTime(student.last_login) || 'N/A' }}</p>
          </div>
        </div>

        <div class="w-full flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            class="flex-1"
            @click="handleSendEmail"
          >
            Send Email
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            class="flex-1"
            size="sm"
            @click="handleSendSlackMessage"
          >
            Slack Message
          </UButton>
        </div>
    </div>
  </UCard>
</template>
