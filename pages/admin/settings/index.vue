<script setup lang="ts">
const emails = ref<string[]>([])
const loading = ref(false)
const toast = useToast()

async function addAdmins() {
  if (emails.value.length === 0) {
    toast.add({
      title: 'Error',
      description: 'Please enter at least one email address',
      color: 'error'
    })
    return
  }

  // Validate emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const invalidEmails = emails.value.filter(email => !emailRegex.test(email))

  if (invalidEmails.length > 0) {
    toast.add({
      title: 'Error',
      description: `Invalid email(s): ${invalidEmails.join(', ')}`,
      color: 'error'
    })
    return
  }

  loading.value = true

  try {
    const response = await $fetch('/api/admin/add', {
      method: 'POST',
      body: { emails: emails.value }
    })

    let description = response.message || `Successfully added ${response.added} admin user(s)`

    if (response.skipped > 0) {
      description += `. ${response.skipped} email(s) already exist as admin(s).`
    }

    toast.add({
      title: 'Success',
      description: description,
      color: 'success'
    })

    emails.value = []
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data?.message || 'Failed to add admin users',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
      <UDashboardPanel id="settings">
        <template #header>
            <UDashboardNavbar title="Settings" >
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="mt-6 w-full lg:max-w-xl mx-auto gap-0">
                <div>
                    <h1 class="text-highlighted font-medium text-left w-full">Admin Management</h1>
                    <p class="text-muted text-[15px] text-pretty mt-1">Manage admin users</p>
                </div>

                <UCard
                variant="subtle"
                class="mt-4 flex justify-center"
                :ui="{
                        body: '!py-4 w-full !px-8'
                }"
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
                            :loading="loading"
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
        </template>
    </UDashboardPanel>
</template>