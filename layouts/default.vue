<script setup lang="ts">
  import { onMounted } from "vue";
  import { useRoute } from "vue-router";
  import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";

  const XL_BREAKPOINT = 1280;

  function handleResize() {
    if (window.innerWidth < XL_BREAKPOINT) {
      isCollapsed.value = true;
    }
  }

  onMounted(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
  });

  onBeforeUnmount(() => {
    window.removeEventListener("resize", handleResize);
  });

  const supabase = useSupabaseClient();
  const route = useRoute();

  const isCollapsed = ref(false);
  const active = ref();

  const userName = ref("");
  const userImg = ref("");
  const open = ref(false);

  const styleNav = computed(() => {
    return isCollapsed.value ? "w-10 flex items-center mt-2" : "w-48";
  });

  const styleContainer = computed(() => {
    return isCollapsed.value ? "flex items-center" : "flex items-end";
  });

  const items = computed<DropdownMenuItem[][]>(() => [
    [
      {
        label: userName.value,
        avatar: {
          src: userImg.value,
        },
        type: "label",
      },
    ],
    [
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
      label: "Dashboard",
      to: "/admin/dashboard",
      ariaLabel: "Dashboard",
      active: true,
      icon: "i-lucide-house",
      tooltip: {
        text: "Dashboard",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-lg", // Responsive text size
      },
    },
    {
      label: "Analytics",
      to: "/",
      icon: "i-lucide-chart-no-axes-combined",
      ariaLabel: "Analytics",
      tooltip: {
        text: "Analytics",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-lg", // Responsive text size
      },
    },
    {
      label: "Messages",
      icon: "i-lucide-send",
      ariaLabel: "Messages",
      to: "/",
      tooltip: {
        text: "Messages",
      },
      ui: {
        linkLabel: "xl:text-sm 2xl:text-lg", // Responsive text size
      },
    },
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

  const links = [mainLinks, secondaryLinks];

  onMounted(async () => {
    // Initialize active link based on current route or default to first link
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userName.value = user?.user_metadata?.full_name || "Unknown User";
    userImg.value = user?.user_metadata?.picture;
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
      class="border-border flex h-screen flex-shrink-0 flex-col gap-2 border-r-[1.5px] px-2 pt-6 pb-2 dark:border-neutral-700"
    >
      <div
        :class="isCollapsed ? 'justify-center' : 'justify-start'"
        class="flex w-full items-center gap-2"
      >
        <img v-if="!isCollapsed" src="../public/favicon.png" alt="Logo" class="ml-2 h-5 w-5" />
        <p v-if="!isCollapsed" class="text-currentColor text-sm font-semibold">Amsterdam Tech</p>
        <UIcon
          @click="isCollapsed = !isCollapsed"
          v-if="!isCollapsed"
          name="i-lucide-panel-left-close"
          class="ml-auto size-5 cursor-pointer"
        />
        <UIcon
          v-else
          name="i-lucide-panel-left-open"
          class="size-5 cursor-pointer"
          @click="isCollapsed = !isCollapsed"
        />
      </div>

      <UNavigationMenu
        color="info"
        v-model="active"
        :tooltip="isCollapsed"
        :collapsed="isCollapsed"
        orientation="vertical"
        :items="links[0]"
        :class="styleNav"
        class="mt-2 cursor-pointer"
      />

      <UNavigationMenu
        color="info"
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
          content: 'w-48',
        }"
      >
        <div
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md py-1 pr-1 pl-2 transition delay-100 hover:bg-gray-100"
        >
          <UAvatar alt="User Avatar" size="2xs" :src="userImg" />
          <p v-if="!isCollapsed" class="text-currentColor text-sm font-semibold">{{ userName }}</p>
          <UIcon
            v-if="!isCollapsed"
            name="i-lucide-chevrons-up-down"
            class="text-muted ml-auto size-4"
          />
        </div>
      </UDropdownMenu>
    </div>
    <main class="h-screen flex-1 overflow-y-auto">
      <slot />
    </main>
  </div>
</template>
