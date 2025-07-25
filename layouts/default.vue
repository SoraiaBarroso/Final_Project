<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { onMounted } from 'vue'

const supabase = useSupabaseClient()

const isCollapsed = ref(false)
const active = ref()
const userName = ref('')
const userImg = ref('')

const styleNav = computed(() => {
  return isCollapsed.value ? 'w-10 flex items-center mt-2' : 'w-48'
})

const styleContainer = computed(() => {
  return isCollapsed.value ? 'flex items-center' : 'flex items-end'
})

const userStyle = computed(() => {
  return isCollapsed.value ? 'hidden' : 'flex'
})

const mainLinks: NavigationMenuItem[] = [
  {
    label: 'Dashboard',
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
    to: 'https://github.com/nuxt/ui',
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
  console.log("Current user:", user);
  console.log("User Name:", userName.value);
  console.log("User Image:", userImg.value);
})
</script>


<template>
  <div class="flex flex-row min-h-screen">
    <div :class="styleContainer" class="flex flex-col gap-2 py-4 px-2 border-r-[1.5px] border-border dark:border-neutral-700">
      <UIcon @click="isCollapsed = !isCollapsed" v-if="!isCollapsed" name="i-lucide-panel-left-close" class="size-5 cursor-pointer"/>
      <UIcon v-else name="i-lucide-panel-left-open" class="size-5 cursor-pointer" @click="isCollapsed = !isCollapsed"/>
      <UNavigationMenu v-model="active" :tooltip="isCollapsed" :collapsed="isCollapsed" orientation="vertical" :items="links[0]" :class="styleNav" class="cursor-pointer mt-2" />
      <UNavigationMenu v-model="active" :tooltip="isCollapsed" :collapsed="isCollapsed" orientation="vertical" :items="links[1]" :class="[styleNav, 'mt-auto']" class="cursor-pointer" />
      <div class="w-full border-t-[1.5px] border-border pt-2 dark:border-neutral-700 flex items-center justify-start gap-2 px-2">
        <UAvatar size="2xs" :src="userImg" />
        <p :class="userStyle" class="text-muted font-semibold text-sm">{{ userName }}</p>
      </div>
    </div>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>