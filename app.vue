<script setup lang="ts">
  import { TooltipProvider } from "reka-ui";

  const appConfig = useAppConfig();

  onMounted(() => {
    // Any layout-specific logic can go here
    const themeColor = localStorage.getItem("theme-color");

    if (themeColor) {
      appConfig.ui.colors.primary = themeColor;
    }
  });
</script>

<template>
  <TooltipProvider>
    <UApp>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </TooltipProvider>
</template>
