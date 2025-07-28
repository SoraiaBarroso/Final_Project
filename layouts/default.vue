<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { DropdownMenuItem } from '@nuxt/ui'

import { onMounted } from 'vue'

const XL_BREAKPOINT = 1280

function handleResize() {
  if (window.innerWidth < XL_BREAKPOINT) {
    isCollapsed.value = true
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})

const supabase = useSupabaseClient()

const isCollapsed = ref(false)
const active = ref()

const userName = ref('')
const userImg = ref('')
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

const userStyle = computed(() => {
  return isCollapsed.value ? 'hidden' : 'flex'
})

const styleUserContainer = computed(() => {
  return isCollapsed.value ? 'justify-center' : 'justify-start px-2'
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
        navigateTo('/login')
      },
      icon: 'i-lucide-log-out',
      kbds: ['shift', 'meta', 'q']
    }
  ]
])

const mainLinks: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
    to: '/admin/dashboard',
    active: true,
    icon: 'i-lucide-house',
    tooltip: {
      text: 'Dashboard',
    },
    onClick: () => {
      active.value = '0'
    }
  },
  {
    label: 'Analytics',
    to: '/',
    icon: 'i-lucide-chart-no-axes-combined',
    tooltip: {
      text: 'Analytics',
    },
    onClick: () => {
      active.value = '1'
    }
  },
  {
    label: 'Messages',
    icon: 'i-lucide-inbox',
    to: '/',
    tooltip: {
      text: 'Messages',
    },
    onClick: () => {
      active.value = '2'
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
})
</script>


<template>
  <div class="flex flex-row min-h-screen">
    <div :class="styleContainer" class="flex flex-col gap-2 py-4 px-2 border-r-[1.5px] border-border dark:border-neutral-700">
      <div :class="isCollapsed ? 'justify-center' : 'justify-start'" class="flex items-center gap-2 w-full">
        <img v-if="!isCollapsed" src="../public/favicon.png" alt="Logo" class="w-5 h-5 ml-2" />
        <p v-if="!isCollapsed" class="text-currentColor font-semibold text-sm">Amsterdam Tech</p>
        <UIcon @click="isCollapsed = !isCollapsed" v-if="!isCollapsed" name="i-lucide-panel-left-close" class="size-5 cursor-pointer ml-auto"/>
        <UIcon v-else name="i-lucide-panel-left-open" class="size-5 cursor-pointer" @click="isCollapsed = !isCollapsed"/>
      </div>
      <UNavigationMenu v-model="active" :tooltip="isCollapsed" :collapsed="isCollapsed" orientation="vertical" :items="links[0]" :class="styleNav" class="cursor-pointer mt-2" />
      <UNavigationMenu v-model="active" :tooltip="isCollapsed" :collapsed="isCollapsed" orientation="vertical" :items="links[1]" :class="[styleNav, 'mt-auto']" class="cursor-pointer border-b-[1.5px] pb-2 border-border" />
      <div :class="styleUserContainer" class="w-full relative hover:bg-gray-100 rounded-md dark:border-neutral-700 py-1 cursor-pointer transition delay-100 flex items-center gap-[8px]">
        <UDropdownMenu
          v-model:open="open"
          :items="items"
          :ui="{
            content: 'w-48'
          }"
        >
          <UIcon v-if="!isCollapsed" :class="userStyle" name="i-lucide-chevrons-up-down" class="size-4 text-currentColor ml-auto absolute right-2" />
          <UAvatar size="2xs" :src="userImg" />
          <p :class="userStyle" class="text-currentColor font-semibold text-sm">{{ userName }}</p>
        </UDropdownMenu>
      </div>
    </div>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>