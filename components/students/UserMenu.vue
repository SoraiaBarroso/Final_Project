<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const props = defineProps<{
  collapsed?: boolean,
  userLabel?: any,
  userAvatar?: any,
  student?: any
}>()

const supabase = useSupabaseClient();
const colorMode = useColorMode();
const appConfig = useAppConfig();

const userLabel = computed(() => props.userLabel ?? 'Guest')
const userAvatar = computed(() => {
  if (props.userAvatar && typeof props.userAvatar === 'string' && props.userAvatar.length > 0) {
    return { src: props.userAvatar }
  }
  return undefined
})
// Student card modal state
const isCardModalOpen = ref(false)

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


const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  label: userLabel.value,
  avatar: userAvatar.value
}],    [
      {
        label: "Student Card",
        icon: "i-lucide-id-card",
        onSelect: () => {
          isCardModalOpen.value = true
        }
      },
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
    ],]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :avatar="userAvatar"
      :label="collapsed ? undefined : userLabel"
      :trailingIcon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #chip-leading="{ item }">
      <span
        :style="{
          '--chip-light': `var(--color-${(item as any).chip}-500)`,
          '--chip-dark': `var(--color-${(item as any).chip}-400)`
        }"
        class="ms-0.5 size-2 rounded-full bg-(--chip-light) dark:bg-(--chip-dark)"
      />
    </template>
  </UDropdownMenu>

  <!-- Student Card Modal -->
  <UModal v-model:open="isCardModalOpen" title="Student Card" :ui="{ footer: 'justify-end' }">
    <template #body>
      <div v-if="student" class="flex flex-col items-center gap-4">
        <StudentsStudentCard :student="student" />
        <p class="text-sm text-muted">Click the button above to download your student ID card</p>
      </div>
      <div v-else class="text-center text-muted">
        <p>Loading student data...</p>
      </div>
    </template>
    <template #footer="{ close }">
      <UButton label="Close" color="neutral" variant="outline" @click="close" />
    </template>
  </UModal>
</template>