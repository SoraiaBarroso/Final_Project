<script setup lang="ts">
definePageMeta({
    layout: "default",
    middleware: ["admin"],
});

import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

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

const toast = useToast()
const isUploading = ref(false)
const uploadResult = ref<any>(null)

// Parse CSV file
function parseCSV(text: string) {
  const lines = text.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',').map(h => h.trim())

  const students = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    students.push({
      name: values[0] || '',
      qwasarId: values[1] || null,
      email: values[2] || '',
      programme: values[3] || '',
      cohort: values[4] || ''
    })
  }

  return students
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  isUploading.value = true
  uploadResult.value = null

  try {
    const file = event.data.csvFile

    // Read file content
    const text = await file.text()

    // Parse CSV
    const students = parseCSV(text)

    // Send to API
    const data = await $fetch('/api/students/import', {
      method: 'POST',
      body: { students }
    })

    uploadResult.value = data

    const message = data.skipped > 0
      ? `Imported ${data.inserted} students, skipped ${data.skipped} duplicates`
      : `Successfully imported ${data.inserted} students`

    toast.add({
      title: 'Import Complete',
      description: message,
      color: 'success'
    })

    // Reset form
    state.csvFile = undefined

  } catch (error: any) {
    console.error('Upload error:', error)
    toast.add({
      title: 'Import Failed',
      description: error.message || 'An error occurred during import',
      color: 'error'
    })
  } finally {
    isUploading.value = false
  }
}
</script>

<template>
    <UDashboardPanel id="students"
     :ui="{
        body: 'mt-6 w-full lg:max-w-xl mx-auto !gap-0'
     }"
    >
        <template #header>
            <UDashboardNavbar title="Students" >
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
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
                        :loading="isUploading"
                        :disabled="isUploading"
                    />
                </UForm>
            </UCard>
        </template>
    </UDashboardPanel>
</template>