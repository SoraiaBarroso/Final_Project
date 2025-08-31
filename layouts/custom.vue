<script setup lang="ts">
import { useRoute } from 'vue-router';
import type { NavigationMenuItem } from '@nuxt/ui';
import type { DropdownMenuItem } from '@nuxt/ui';

import { onMounted, watch } from 'vue';

const supabase = useSupabaseClient();
const route = useRoute();

const isCollapsed = ref(false);
const active = ref();
const userName = ref('');
const userImg = ref('');
const userLoading = ref(true);
const open = ref(false);

const styleNav = computed(() => {
  return isCollapsed.value ? 'w-10 flex items-center mt-2' : 'xl:w-48 2xl:w-54';
});

const styleContainer = computed(() => {
  return isCollapsed.value ? 'flex items-center' : 'flex items-end';
});

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: userName.value,
      avatar: {
        src: userImg.value,
      },
      type: 'label',
      ui: {
        label: 'xl:text-sm 2xl:text-base', // Responsive text size
      }
    },
  ],
  [
    {
      label: 'Logout',
      onClick: async () => {
        await supabase.auth.signOut();
        navigateTo('/');
      },
      icon: 'i-lucide-log-out',
      kbds: ['shift', 'meta', 'q'],
    },
  ],
]);

const mainLinks: NavigationMenuItem[] = [
  {
    label: 'Home',
    to: '/students/student_data',
    icon: 'i-lucide-users',
    tooltip: {
      text: 'Home',
    },
    ui: {
      linkLabel: 'xl:text-sm 2xl:text-base', // Responsive text size
    }
  },
  {
    label: 'Calendar',
    to: '/students/calendar',
    ariaLabel: 'Calendar',
    icon: 'i-lucide-calendar',
    tooltip: {
      text: 'Calendar',
    },
    ui: {
      linkLabel: 'xl:text-sm 2xl:text-base', // Responsive text size
    }
  },
  {
    label: 'Timeline',
    to: '/test',
    badge: '3',
    icon: 'lucide-calendar-clock',
    tooltip: {
      text: 'Timeline',
    },
    ui: {
      linkLabel: 'xl:text-sm 2xl:text-base', // Responsive text size
    }
  },
];

const secondaryLinks: NavigationMenuItem[] = [
  {
    label: 'Issues',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/SoraiaBarroso/Final_Project',
    target: '_blank',
    tooltip: {
      text: 'Write issue on GitHub',
    },
    ui: {
      linkLabel: 'xl:text-sm 2xl:text-base', // Responsive text size
    }
  },
];

const links = [mainLinks, secondaryLinks];

onMounted(async () => {
  // Initialize active link based on current route or default to first link
  const { data: { user } } = await supabase.auth.getUser();
  userName.value = user?.user_metadata?.full_name || 'Unknown User';
  userImg.value = user?.user_metadata?.picture;
  userLoading.value = false;

  // Set active state based on current route
  active.value = mainLinks.findIndex((link) => link.to === route.path);
});

// Watch for route changes and update active state
watch(
  () => route.path,
  (newPath) => {
    active.value = mainLinks.findIndex((link) => link.to === newPath);
  }
);
</script>

<template>
  <div class="flex flex-row min-h-screen">
    <div :class="styleContainer" class="flex flex-col gap-2 pt-6 pb-2 px-3 border-r-[1.5px] border-border dark:border-neutral-700 h-screen flex-shrink-0">
      <div :class="isCollapsed ? 'justify-center pb-2' : 'justify-start pl-2'" class="flex items-center gap-3 w-full mb-2">
        <img src="../public/favicon.png" alt="Logo" class="xl:w-5 xl:h-5 w-5 h-5" />
        <p v-if="!isCollapsed" class="text-currentColor font-semibold xl:text-sm 2xl:text-lg">Amsterdam Tech</p>
        <!-- <UIcon @click="isCollapsed = !isCollapsed" v-if="!isCollapsed" name="i-lucide-panel-left-close" class="size-5 cursor-pointer ml-auto" /> -->
        <!-- <UIcon v-else name="i-lucide-panel-left-open" class="size-5 cursor-pointer" @click="isCollapsed = !isCollapsed" /> -->
      </div>

      <UNavigationMenu
        color="info"
        v-model="active"
        :tooltip="isCollapsed"
        :collapsed="isCollapsed"
        orientation="vertical"
        :items="links[0]"
        :class="styleNav"
        class="cursor-pointer mt-2"
      />

      <UNavigationMenu
        color="info"
        v-model="active"
        :tooltip="isCollapsed"
        :collapsed="isCollapsed"
        orientation="vertical"
        :items="links[1]"
        :class="[styleNav, 'mt-auto']"
        class="cursor-pointer border-b-[1.5px] pb-2 border-border"
      />

      <UDropdownMenu
        v-model:open="open"
        :items="items"
        :ui="{
          content: 'xl:w-48 2xl:w-56',
        }"
      >
        <div :class="isCollapsed ? 'pl-1' : 'pl-2'" class="flex items-center justify-center cursor-pointer hover:bg-gray-100 gap-2 w-full py-1 rounded-md transition delay-100 pr-1">
          <UAvatar alt="User Avatar" size="2xs" :src="userImg" />
          <p v-if="!isCollapsed" class="text-currentColor font-semibold xl:text-sm 2xl:text-base">{{ userName }}</p>
          <UIcon v-if="!isCollapsed" name="i-lucide-chevrons-up-down" class="size-4 text-muted ml-auto" />
        </div>
      </UDropdownMenu>
    </div>
    <main class="flex-1 h-screen overflow-y-auto">
      <div class="w-full h-18 border-b border-border flex justify-between items-center px-6 sticky top-0 z-10 bg-white">
        <div class="flex items-center gap-4">
          <UIcon @click="isCollapsed = !isCollapsed" name="i-lucide-panel-left-close" class="size-5 cursor-pointer" />
          <h1 class="2xl:text-lg font-semibold">Home</h1>
        </div>
        <UIcon name="i-lucide-bell" class="size-5 cursor-pointer cursor-pointer"/>
      </div>
      <slot />
    </main>
  </div>
</template>