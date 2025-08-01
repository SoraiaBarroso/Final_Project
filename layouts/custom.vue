<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { DropdownMenuItem } from '@nuxt/ui'

import { onMounted } from 'vue'

const supabase = useSupabaseClient()

const isCollapsed = ref(false)
const active = ref()
const userName = ref('')
const userImg = ref('')
const userLoading = ref(true)
const open = ref(false)

const openDropdown = () => {
  open.value = !open.value
}

const styleNav = computed(() => {
  return isCollapsed.value ? 'w-10 flex items-center mt-2' : 'w-48'
})

const styleContainer = computed(() => {
  return isCollapsed.value ? 'flex items-center' : 'flex items-end'
})

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: userName.value,
      avatar: {
        src: userImg.value
      },
      type: 'label'
    }
  ],
  [
    {
      label: 'Logout',
      onClick: async () => {
        await supabase.auth.signOut()
        clearNuxtData() 
        navigateTo('/')
      },
      icon: 'i-lucide-log-out',
      kbds: ['shift', 'meta', 'q']
    }
  ]
])

const mainLinks: NavigationMenuItem[] = [
  {
    label: 'Home',
    active: true,
    icon: 'i-lucide-users',
    tooltip: {
      text: 'Home',
    },
    onClick: () => {
      active.value = '0'
    }
  },
  {
    label: 'Inbox',
    to: '/',
    badge: '3',
    icon: 'i-lucide-inbox',
    tooltip: {
      text: 'Inbox',
    },
    onClick: () => {
      active.value = '1'
    }
  },
]

const secondaryLinks: NavigationMenuItem[] = [
  {
    label: 'Issues',
    icon: 'i-simple-icons-github',
    to: 'https://github.com/SoraiaBarroso/Final_Project',
    target: '_blank',
    tooltip: {
      text: 'Write issue on GitHub',
    },
  },
]

const links = [mainLinks, secondaryLinks]

onMounted(async () => {
  // Initialize active link based on current route or default to first link
  const { data: { user } } = await supabase.auth.getUser();
  userName.value = user?.user_metadata?.full_name || 'Unknown User';
  userImg.value = user?.user_metadata?.picture;
  userLoading.value = false;
})
</script>

<template>
  <div class="flex flex-row min-h-screen">
    <div :class="styleContainer" class="flex flex-col gap-2 pt-6 pb-2 px-2 border-r-[1.5px] border-border dark:border-neutral-700 h-screen flex-shrink-0">
      
      <div :class="isCollapsed ? 'justify-center' : 'justify-start'" class="flex items-center gap-2 w-full">
        <img v-if="!isCollapsed" src="../public/favicon.png" alt="Logo" class="w-5 h-5 ml-2" />
        <p v-if="!isCollapsed" class="text-currentColor font-semibold text-sm">Amsterdam Tech</p>
        <UIcon @click="isCollapsed = !isCollapsed" v-if="!isCollapsed" name="i-lucide-panel-left-close" class="size-5 cursor-pointer ml-auto"/>
        <UIcon v-else name="i-lucide-panel-left-open" class="size-5 cursor-pointer" @click="isCollapsed = !isCollapsed"/>
      </div>
      
      <UNavigationMenu color="info" v-model="active" :tooltip="isCollapsed" :collapsed="isCollapsed" orientation="vertical" :items="links[0]" :class="styleNav" class="cursor-pointer mt-2" />
      
      <UNavigationMenu color="info" v-model="active" :tooltip="isCollapsed" :collapsed="isCollapsed" orientation="vertical" :items="links[1]" :class="[styleNav, 'mt-auto']" class="cursor-pointer border-b-[1.5px] pb-2 border-border" />
      
      <UDropdownMenu
        v-model:open="open"
        :items="items"
        :ui="{
          content: 'w-48'
        }"
      >
        <div class="flex items-center justify-center cursor-pointer hover:bg-gray-100 gap-2 w-full py-1 rounded-md transition delay-100 pl-2 pr-1">
          <UAvatar alt="User Avatar" size="2xs" :src="userImg" />
          <p v-if="!isCollapsed" class="text-currentColor font-semibold text-sm">{{ userName }}</p>
          <UIcon v-if="!isCollapsed" name="i-lucide-chevrons-up-down" class="size-4 text-muted ml-auto" />
        </div>
      </UDropdownMenu>

    </div>
    <main class="flex-1 h-screen overflow-y-auto">
      <slot />
    </main>
  </div>
</template>