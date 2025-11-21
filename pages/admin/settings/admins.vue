<script setup lang="ts">
definePageMeta({
  layout: "default",
  middleware: ["admin"],
});

const emails = ref<string[]>([])

// Use composables
const { validateEmails, isNotEmpty } = useValidation()
const { addAdmins: addAdminsApi, loading: adminLoading } = useAdminApi()
const { showSuccess, showError } = useNotifications()

async function addAdmins() {
  if (!isNotEmpty(emails.value)) {
    showError('Error', 'Please enter at least one email address')
    return
  }

  const validation = validateEmails(emails.value)

  if (!validation.isValid) {
    showError('Error', `Invalid email(s): ${validation.invalid.join(', ')}`)
    return
  }

  try {
    const response = await addAdminsApi(emails.value)
    let description = response.message || `Successfully added ${response.added} admin user(s)`

    if (response.skipped > 0) {
      description += `. ${response.skipped} email(s) already exist as admin(s).`
    }

    showSuccess('Success', description)
    emails.value = []
  } catch (error: any) {
    showError('Error', error.data?.message || 'Failed to add admin users')
  }
}
</script>

<template>
      <div class="mt-6 w-full lg:max-w-2xl mx-auto gap-6 space-y-8">
        <!-- Admin Management Section -->
        <div>
          <h1 class="text-highlighted font-medium text-left w-full">Admin Management</h1>
          <p class="text-muted text-[15px] text-pretty mt-1">Manage admin users</p>

          <UCard
            variant="subtle"
            class="mt-4"
            :ui="{ body: '!py-4 w-full !px-8' }"
          >
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-highlighted mb-2">
                  Add Admin Users
                </label>
                <p class="text-muted text-sm mb-3">
                  Enter email addresses to grant admin access. Press Enter to add multiple emails.
                </p>
                <UInputTags
                  v-model="emails"
                  placeholder="Enter email addresses..."
                  size="md"
                  class="w-full"
                />
              </div>

              <UButton
                @click="addAdmins"
                :loading="adminLoading"
                :disabled="emails.length === 0"
                color="primary"
                variant="subtle"
                block
              >
                Add {{ emails.length > 0 ? emails.length : '' }} Admin{{ emails.length !== 1 ? 's' : '' }}
              </UButton>
            </div>
          </UCard>
        </div>
      </div>
</template>
