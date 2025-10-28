<script setup lang="ts">
definePageMeta({
    layout: "default",
    middleware: ["admin"], 
});

import type { NavigationMenuItem } from '@nuxt/ui'

const links = [[ {
  label: 'Students',
  icon: 'i-lucide-users',
  to: '/admin/managment/students'
}, {
  label: 'Seasons',
  icon: 'i-lucide-bell',
  to: '/admin/managment/seasons'
},],] satisfies NavigationMenuItem[][]
</script>

<template>
    <UDashboardPanel id="managment">
        <template #header>
            <UDashboardNavbar title="Managment" >
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>

            <UDashboardToolbar>
                <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
            </UDashboardToolbar>
        </template>

        <template #body>
            <NuxtPage />
        </template>
    </UDashboardPanel>
</template>