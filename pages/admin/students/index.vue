<script setup lang="ts">
definePageMeta({
    layout: "default",
    middleware: ["admin"], 
});

import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[ {
  label: 'Overall',
  icon: 'i-lucide-users',
  to: '/admin/analytics/overall'
}, {
  label: 'Cohort',
  icon: 'i-lucide-bell',
  to: '/admin/analytics/cohort'
},],] satisfies NavigationMenuItem[][]
</script>

<template>
    <UDashboardPanel id="students">
        <template #header>
            <UDashboardNavbar title="Students" >
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
            </UDashboardToolbar>
        </template>

        <template #body>
          <h2 class="text-highlighted font-medium">Import Students</h2>
           <!-- <UButton
               icon="i-lucide-plus"
               color="neutral"
               variant="outline"
               class="mb-4"
           >
              Import Students
           </UButton> -->
        </template>
    </UDashboardPanel>
</template>