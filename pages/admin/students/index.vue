<template>
  <UDashboardPanel id="students">
    <template #header>
      <UDashboardNavbar title="Students">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <p>Student Management - Please navigate to the dashboard to view students.</p>
    </template>
  </UDashboardPanel>
</template>

<script setup>
definePageMeta({
  layout: 'default',
  middleware: ['admin']
})
</script>
