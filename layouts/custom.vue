<script setup lang="ts">
  import { onMounted, watch } from "vue";
  import { useRoute } from "vue-router";
  import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

  const supabase = useSupabaseClient();
  const route = useRoute();
  const colorMode = useColorMode();
  const appConfig = useAppConfig();

  const isCollapsed = ref(false);
  const active = ref();
  const userName = ref("");
  const userImg = ref("");
  const userLoading = ref(true);
  const open = ref(false);

  const colors = [
    "gray",
    "red",
    "orange",
    "yellow",
    "green",
    "laurel",
    "esmerald",
    "teal",
    "blue",
    "glacier",
    "purple",
    "pink",
  ];

  const styleNav = computed(() => {
    return isCollapsed.value ? "w-10 flex items-center mt-2" : "xl:w-48 2xl:w-54";
  });

  const styleContainer = computed(() => {
    return isCollapsed.value ? "flex items-center" : "flex items-end";
  });

  // Helper to get a readable page title from the route
  const getPageTitle = (route: any) => {
    if (route.meta && route.meta.title) return route.meta.title;
    const segments = route.path.split("/").filter(Boolean);
    if (segments.length === 0) return "Home";
    const last = segments[segments.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
  };

  const items = computed<DropdownMenuItem[][]>(() => [
    [
      {
        label: userName.value,
        avatar: {
          src: userImg.value,
        },
        type: "label",
        ui: {
          label: "xl:text-sm 2xl:text-base", // Responsive text size
        },
      },
    ],
    [
      {
        label: "Theme",
        icon: "i-lucide-palette",
        children: [
          {
            label: "Primary",
            slot: "chip",
            chip: appConfig.ui.colors.primary,
            children: colors.map((color) => ({
              label: color,
              chip: color,
              slot: "chip",
              type: "checkbox",
              checked: appConfig.ui.colors.primary === color,
              onSelect: (e) => {
                e.preventDefault();
                appConfig.ui.colors.primary = color;
                localStorage.setItem("theme-color", color);
              },
            })),
          },
        ],
      },
      {
        label: "Appearance",
        icon: "i-lucide-sun-moon",
        children: [
          {
            label: "Light",
            icon: "i-lucide-sun",
            type: "checkbox",
            checked: colorMode.value === "light",
            onSelect(e: Event) {
              e.preventDefault();
              colorMode.preference = "light";
            },
          },
          {
            label: "Dark",
            icon: "i-lucide-moon",
            type: "checkbox",
            checked: colorMode.value === "dark",
            onSelect(e: Event) {
              e.preventDefault();
              colorMode.preference = "dark";
            },
          },
        ],
      },
      {
        label: "Logout",
        onClick: async () => {
          await supabase.auth.signOut();
          navigateTo("/");
        },
        icon: "i-lucide-log-out",
        kbds: ["shift", "meta", "q"],
      },
    ],
  ]);

  const mainLinks: NavigationMenuItem[] = [
    {
      label: "Home",
      to: "/students/dashboard",
      icon: "i-lucide:house",
      tooltip: {
        text: "Home",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-base", // Responsive text size
      },
    },
    {
      label: "Calendar",
      to: "/students/calendar",
      ariaLabel: "Calendar",
      icon: "i-lucide-calendar",
      tooltip: {
        text: "Calendar",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-base", // Responsive text size
      },
    },
    {
      label: "Timeline",
      to: "/timeline",
      badge: "3",
      icon: "i-lucide:folder-clock",
      tooltip: {
        text: "Timeline",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-base", // Responsive text size
      },
    },
    {
      label: "Roadmap",
      to: "/students/roadmap",
      icon: "i-lucide-map",
      tooltip: {
        text: "Roadmap",
      },
    },
  ];

  const secondaryLinks: NavigationMenuItem[] = [
    {
      label: "Notion",
      icon: "i-lineicons:notion",
      to: "https://www.notion.so/elu-programme/Help-Sheet-5ee210707ad24004b0d35473d7fb6f4e",
      target: "_blank",
      tooltip: {
        text: "Go to Notion docs",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-base", // Responsive text size
      },
    },
    {
      label: "Recordings",
      icon: "i-solar:videocamera-record-outline",
      to: "https://reka-ui.com/",
      target: "_blank",
      tooltip: {
        text: "Workshop Recordings",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-base", // Responsive text size
      },
    },
  ];

  const links = [mainLinks, secondaryLinks];

  onMounted(async () => {
    // Initialize active link based on current route or default to first link
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userName.value = user?.user_metadata?.full_name || "Unknown User";
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
  <div class="flex min-h-screen flex-row">
    <div
      :class="styleContainer"
      class="border-border flex h-screen flex-shrink-0 flex-col gap-2 border-r-[1.5px] px-3 pt-4 pb-4 dark:border-neutral-700"
    >
      <div
        :class="isCollapsed ? 'mt-1 justify-center pb-2' : 'justify-start pl-2'"
        class="mb-2 flex w-full items-center gap-3"
      >
        <img src="../public/favicon.png" alt="Logo" class="h-5 w-5 xl:h-5 xl:w-5" />
        <p v-if="!isCollapsed" class="text-currentColor font-semibold xl:text-sm 2xl:text-base">
          Amsterdam Tech
        </p>
      </div>

      <UNavigationMenu
        color="primary"
        v-model="active"
        :tooltip="isCollapsed"
        :collapsed="isCollapsed"
        orientation="vertical"
        :items="links[0]"
        :class="styleNav"
        class="mt-2 cursor-pointer"
        :ui="{
          item: 'mb-0.5',
        }"
      />

      <UNavigationMenu
        color="primary"
        v-model="active"
        :tooltip="isCollapsed"
        :collapsed="isCollapsed"
        orientation="vertical"
        :items="links[1]"
        :class="[styleNav, 'mt-auto']"
        class="border-border cursor-pointer border-b-[1.5px] pb-2"
      />

      <UDropdownMenu
        v-model:open="open"
        :items="items"
        :ui="{
          content: 'xl:w-48 2xl:w-56',
        }"
      >
        <div
          :class="isCollapsed ? 'pl-1' : 'pl-2'"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md py-1 pr-1 transition delay-100 hover:bg-gray-100"
        >
          <UAvatar alt="User Avatar" size="2xs" :src="userImg" />
          <p v-if="!isCollapsed" class="text-currentColor font-semibold xl:text-sm 2xl:text-base">
            {{ userName }}
          </p>
          <UIcon
            v-if="!isCollapsed"
            name="i-lucide-chevrons-up-down"
            class="text-muted ml-auto size-4"
          />
        </div>
        <template #chip-leading="{ item }: { item: { chip: string } }">
          <span
            :style="{
              '--chip-light': `var(--color-${item.chip}-500, #ccc)`,
              '--chip-dark': `var(--color-${item.chip}-400, #888)`,
            }"
            class="ms-0.5 size-2 rounded-full bg-[var(--chip-light)] dark:bg-[var(--chip-dark)]"
          />
        </template>
      </UDropdownMenu>
    </div>

    <main class="flex h-screen flex-1 flex-col">
      <!-- Navbar -->
      <div
        class="border-border sticky top-0 z-10 flex h-14 w-full items-center justify-between border-b bg-white px-8"
      >
        <div class="flex items-center gap-3">
          <UIcon
            v-if="!isCollapsed"
            @click="isCollapsed = !isCollapsed"
            name="i-lucide-panel-left-close"
            class="size-5 cursor-pointer"
          />
          <UIcon
            v-else
            name="i-lucide-panel-left-open"
            class="size-5 cursor-pointer"
            @click="isCollapsed = !isCollapsed"
          />
          <h1 class="font-semibold 2xl:text-base">
            {{ route.meta.title || getPageTitle(route) }}
          </h1>
        </div>

        <UIcon name="i-lucide-bell" class="size-5 cursor-pointer" @click="open = true" />
      </div>

      <!-- Content (slot) -->
      <div class="min-h-0 flex-1 overflow-y-auto">
        <slot />
      </div>
    </main>
  </div>
</template>
