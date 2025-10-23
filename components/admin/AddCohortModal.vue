<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'submit', 'update:isOpen'])

const formData = ref({
  name: '',
  start_date: '',
  end_date: '',
  meeting_id: '',
})

const errors = ref({
  name: '',
  start_date: '',
  end_date: '',
})

const loading = ref(false)

function validateForm() {
  errors.value = {
    name: '',
    start_date: '',
    end_date: '',
  }

  let isValid = true

  if (!formData.value.name.trim()) {
    errors.value.name = 'Cohort name is required'
    isValid = false
  }

  if (!formData.value.start_date) {
    errors.value.start_date = 'Start date is required'
    isValid = false
  }

  if (!formData.value.end_date) {
    errors.value.end_date = 'End date is required'
    isValid = false
  }

  if (formData.value.start_date && formData.value.end_date) {
    const startDate = new Date(formData.value.start_date)
    const endDate = new Date(formData.value.end_date)

    if (endDate <= startDate) {
      errors.value.end_date = 'End date must be after start date'
      isValid = false
    }
  }

  return isValid
}

async function handleSubmit() {
  if (!validateForm()) {
    return
  }

  loading.value = true
  try {
    emit('submit', { ...formData.value })
  } finally {
    loading.value = false
  }
}

function handleClose() {
  formData.value = {
    name: '',
    start_date: '',
    end_date: '',
    meeting_id: '',
  }
  errors.value = {
    name: '',
    start_date: '',
    end_date: '',
  }
  emit('close')
}
</script>

<template>
  <UModal :open="isOpen" @update:open="emit('update:isOpen', $event)" @close="handleClose">
    <UModalContent>
      <UModalHeader>
        <div class="flex items-center gap-3">
          <div class="bg-primary/10 border-primary flex h-10 w-10 items-center justify-center rounded-full border">
            <UIcon name="i-lucide-users" class="text-primary size-5" />
          </div>
          <div>
            <h2 class="text-lg font-semibold text-highlighted">Add New Cohort</h2>
            <p class="text-sm text-muted">This cohort will be created for all programs</p>
          </div>
        </div>
      </UModalHeader>

      <UModalBody>
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Cohort Name -->
          <div class="space-y-2">
            <label for="name" class="text-sm font-medium text-highlighted">
              Cohort Name <span class="text-error">*</span>
            </label>
            <UInput
              id="name"
              v-model="formData.name"
              placeholder="e.g., Sep 24, Mar 25"
              :error="!!errors.name"
              :disabled="loading"
            />
            <p v-if="errors.name" class="text-xs text-error">{{ errors.name }}</p>
            <p class="text-xs text-muted">Enter a name for the cohort (e.g., "Sep 24" for September 2024)</p>
          </div>

          <!-- Start Date -->
          <div class="space-y-2">
            <label for="start_date" class="text-sm font-medium text-highlighted">
              Start Date <span class="text-error">*</span>
            </label>
            <UInput
              id="start_date"
              v-model="formData.start_date"
              type="date"
              :error="!!errors.start_date"
              :disabled="loading"
            />
            <p v-if="errors.start_date" class="text-xs text-error">{{ errors.start_date }}</p>
          </div>

          <!-- End Date -->
          <div class="space-y-2">
            <label for="end_date" class="text-sm font-medium text-highlighted">
              End Date <span class="text-error">*</span>
            </label>
            <UInput
              id="end_date"
              v-model="formData.end_date"
              type="date"
              :error="!!errors.end_date"
              :disabled="loading"
            />
            <p v-if="errors.end_date" class="text-xs text-error">{{ errors.end_date }}</p>
          </div>

          <!-- Meeting ID (Optional) -->
          <div class="space-y-2">
            <label for="meeting_id" class="text-sm font-medium text-highlighted">
              Meeting ID <span class="text-muted text-xs">(optional)</span>
            </label>
            <UInput
              id="meeting_id"
              v-model="formData.meeting_id"
              placeholder="e.g., abc-defg-hij"
              :disabled="loading"
            />
            <p class="text-xs text-muted">Enter a meeting ID if applicable</p>
          </div>
        </form>
      </UModalBody>

      <UModalFooter>
        <div class="flex items-center justify-end gap-2">
          <UButton
            color="neutral"
            variant="outline"
            label="Cancel"
            @click="handleClose"
            :disabled="loading"
          />
          <UButton
            color="primary"
            label="Create Cohort"
            icon="i-lucide-plus"
            @click="handleSubmit"
            :loading="loading"
            :disabled="loading"
          />
        </div>
      </UModalFooter>
    </UModalContent>
  </UModal>
</template>
