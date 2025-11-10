<script setup> 
  definePageMeta({
    layout: "custom",
    middleware: ["auth", "student-only"],
  });
</script>

<template>
    <UDashboardPanel id="home">
      <template #header>
          <UDashboardNavbar title="Dashboard" >
              <template #leading>
                  <UDashboardSidebarCollapse />
              </template>

          </UDashboardNavbar>
      </template>

      <template #body>
        hello
      </template>
  </UDashboardPanel>
</template>