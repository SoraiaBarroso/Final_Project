<script setup>
const props = defineProps({
  student: {
    type: Object,
    required: true
  }
})

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
  <UCard>
    <div class="flex items-center gap-6 w-full">
      <UAvatar
        :src="student.profile_image_url"
        :alt="`${student.first_name} ${student.last_name}`"
        class="h-18 w-18"
      />
      <div class="flex flex-col justify-between h-full gap-2">
        <h2 class="text-xl font-bold">{{ student.first_name }} {{ student.last_name }}</h2>
        <div class="flex gap-8">
          <div class="flex flex-col">
            <p class="text-muted text-sm">Cohort</p>
            <p class="text-highlighted text-sm">{{ student.cohorts?.name || 'N/A' }}</p>
          </div>
          <div class="flex flex-col">
            <p class="text-muted text-sm">Program</p>
            <p class="text-highlighted text-sm">{{ student.programs?.name || 'N/A' }}</p>
          </div>
          <div class="flex flex-col">
            <p class="text-muted text-sm">Email</p>
            <p class="text-highlighted text-sm">{{ student.email || 'N/A' }}</p>
          </div>
          <div class="flex flex-col">
            <p class="text-muted text-sm">Last Activity</p>
            <p class="text-highlighted text-sm">{{ formatDateTime(student.last_login) || 'N/A' }}</p>
          </div>
        </div>
      </div>

      <div class="ml-auto mb-auto flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          size="xs"
          @click="handleSendEmail"
        >
          Send Email
        </UButton>
        <UButton
          color="neutral"
          variant="outline"
          class="ml-auto"
          size="xs"
          @click="handleSendSlackMessage"
        >
          Slack Message
        </UButton>
      </div>
    </div>
  </UCard>
</template>
