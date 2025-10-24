<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import UserMenuAdmin from "~/components/admin/UserMenuAdmin.vue";

const supabase = useSupabaseClient();
const appConfig = useAppConfig();

const userName = ref("");
const userImg = ref("");

const mainLinks: NavigationMenuItem[] = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    ariaLabel: "Dashboard",
    icon: "i-lucide-lab:house-roof",
    tooltip: {
      text: "Dashboard",
    },
  },
  {
    label: "Analytics",
    icon: "i-pajamas:chart",
    ariaLabel: "Analytics",
    defaultOpen: true,
    to: '/admin/analytics/overall',
    type: 'trigger',
    tooltip: {
      text: "Analytics",
    },
    children: [
      {
        label: 'Overall ',
        description: 'Overall attendance analytics among all students.',
        to: '/admin/analytics/overall',
      },
      {
        label: 'Cohort ',
        description: 'Cohort-based attendance analytics.',
        to: '/admin/analytics/cohort',
      },
    ],
  },
  {
    label: "Students",
    to: "/admin/students",
    ariaLabel: "Students",
    icon: "i-pajamas:account",
    tooltip: {
      text: "Students",
    },
  },
  {
    label: "Cohorts",
    to: "/admin/cohorts",
    ariaLabel: "Cohorts",
    icon: "i-pajamas:group",
    tooltip: {
      text: "Cohorts",
    },
  }
];

const secondaryLinks: NavigationMenuItem[] = [
  {
    label: "Issues",
    icon: "i-simple-icons-github",
    ariaLabel: "GitHub Issues",
    to: "https://github.com/SoraiaBarroso/Final_Project",
    target: "_blank",
    tooltip: {
      text: "Write issue on GitHub",
    },
  },
];

onMounted(async () => {
  // Initialize active link based on current route or default to first link
  const {
    data: { user },
  } = await supabase.auth.getUser();
  userName.value = user?.user_metadata?.full_name || "Unknown User";
  userImg.value = user?.user_metadata?.picture;
  appConfig.ui.colors.primary = 'blue'
  appConfig.ui.colors.neutral = 'stone'
  
});
</script>

<template>
   <UDashboardGroup>
        <UDashboardSidebar 
            collapsible 
            :ui="{ 
                footer: 'border-t border-default', 
                header: 'flex items-center gap-2'
            }"
        >
            <template #header="{ collapsed }">
                <NuxtImg src="../public/favicon.png" alt="Logo" class="h-6" :class="collapsed ? 'm-auto' : 'ml-2'" />
                <p v-if="!collapsed" class="text-center text-xs xl:text-lg font-semibold text-highlighted">Amsterdam Tech</p>
            </template>

            <template #default="{ collapsed }">
                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="mainLinks"
                    orientation="vertical"
                    :ui="{
                      childItem: 'mt-1',
                      link: 'mt-1'
                    }"
                />

                <UNavigationMenu
                    :collapsed="collapsed"
                    :items="secondaryLinks"
                    orientation="vertical"
                    class="mt-auto"
                />
            </template>

            <template #footer="{ collapsed }">
                <UserMenuAdmin :collapsed="collapsed" :userLabel="userName" :userAvatar="userImg"/>
            </template>
        </UDashboardSidebar>

        <slot />

    </UDashboardGroup>
</template>
