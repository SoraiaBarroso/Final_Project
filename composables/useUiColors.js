// composables/useUiColors.ts
import { useAppConfig } from "#imports";
import { ref, watch } from "vue";

export function useUiColors() {
  const appConfig = useAppConfig();
  // Make a reactive copy
  const colors = ref({ ...appConfig.ui.colors });

  // Watch for changes in appConfig and update local colors
  watch(
    () => appConfig.ui.colors,
    (newColors) => {
      colors.value = { ...newColors };
    },
    { deep: true }
  );

  // Function to update colors in appConfig
  function setColor(key, value) {
    appConfig.ui.colors[key] = value;
    colors.value[key] = value;
  }

  return { colors, setColor };
}
