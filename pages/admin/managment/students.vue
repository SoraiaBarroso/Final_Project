<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { useStudents } from '~/composables/useStudents'
import { useNotifications } from '~/composables/useNotifications'

definePageMeta({
    layout: "default",
    middleware: ["admin"],
});

// Use composables
const { parseCSV, importStudents, loading } = useStudents()
const { showSuccess, showError } = useNotifications()

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB
const ACCEPTED_FILE_TYPES = ['text/csv', 'application/vnd.ms-excel']

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

const schema = z.object({
  csvFile: z
    .instanceof(File, {
      message: 'Please select a CSV file.'
    })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: `The CSV file is too large. Please choose a file smaller than ${formatBytes(MAX_FILE_SIZE)}.`
    })
    .refine((file) => {
      return ACCEPTED_FILE_TYPES.includes(file.type) || file.name.endsWith('.csv')
    }, {
      message: 'Please upload a valid CSV file.'
    })
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  csvFile: undefined
})

const uploadResult = ref<any>(null)

async function onSubmit(event: FormSubmitEvent<Schema>) {
  uploadResult.value = null

  try {
    const file = event.data.csvFile
    const text = await file.text()
    const students = parseCSV(text)
    const data = await importStudents(students)

    uploadResult.value = data

    const message = data.skipped > 0
      ? `Imported ${data.inserted} students, skipped ${data.skipped} duplicates`
      : `Successfully imported ${data.inserted} students`

    showSuccess('Import Complete', message)

    // Reset form
    state.csvFile = undefined

  } catch (error: any) {
    console.error('Upload error:', error)
    showError('Import Failed', error.message || 'An error occurred during import')
  }
}
</script>

<template>
  <div class="mt-6 w-full lg:max-w-xl mx-auto !gap-0">
    <div class="flex justify-between">
        <div>
            <h1 class="text-highlighted font-medium text-left w-full">Student Management</h1>
            <p class="text-muted text-[15px] text-pretty mt-1">Upload a CSV file to add new students to the system.</p>
        </div>

        <UTooltip class="mr-2 mt-1" arrow text="The CSV file should contain the following columns: Name, Qwasar ID, Email, Programme, Cohort" :delay-duration="0">
            <UIcon name="i-lucide-info" class="text-muted text-currentColor size- cursor-pointer" />
        </UTooltip>
    </div>
          

    <UCard
      variant="subtle"
      class="mt-4 flex justify-center"
      :ui="{
          body: '!py-4'
      }"
    >
      <UForm :schema="schema" :state="state" class="space-y-4 w-124" @submit="onSubmit">
        <UFormField name="csvFile" >
            <UFileUpload
              v-model="state.csvFile"
              accept=".csv"
              class="min-h-48"
              label="Drop your CSV here"
              description="or click to browse."
            />
        </UFormField>

        <UButton
            type="submit"
            label="Import Students"
            color="primary"
            variant="soft"
            :loading="loading"
            :disabled="loading || !state.csvFile"
        />
      </UForm>
    </UCard>
  </div>
</template>