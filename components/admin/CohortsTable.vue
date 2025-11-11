<script setup>
import { h, resolveComponent, ref, computed } from "vue";

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent('UDropdownMenu')

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['toggleStatus']);

// Transform flat data into tree structure grouped by cohort name
const treeData = computed(() => {
  const grouped = new Map();

  for (const cohort of props.data) {
    const cohortName = cohort.name;

    if (!grouped.has(cohortName)) {
      grouped.set(cohortName, {
        id: cohortName,
        name: cohortName,
        start_date: cohort.start_date,
        end_date: cohort.end_date,
        meeting_id: cohort.meeting_id,
        is_active: cohort.is_active,
        program_count: cohort.program_count,
        children: []
      });
    }

    const parent = grouped.get(cohortName);

    // Add each program as a child with its meeting_id from the API
    if (cohort.programs && cohort.programs.length > 0) {
      for (const program of cohort.programs) {
        parent.children.push({
          id: `${cohortName}-${program.cohort_id}`,
          name: program.name,
          cohort_id: program.cohort_id,
          program_id: program.id,
          meeting_id: program.meeting_id, // Use meeting_id from program data
          isChild: true
        });
      }
    }
  }

  return Array.from(grouped.values());
});


const sorting = ref([
  {
    id: "start_date",
    desc: true,
  },
]);

const expanded = ref({});

const columns = [
  {
    accessorKey: "name",
    header: "Cohort",
    cell: ({ row }) => {
      const isChild = row.original.isChild;

      return h(
        "div",
        {
          style: {
            paddingLeft: `${row.depth * 2}rem`
          },
          class: "flex items-center gap-2"
        },
        [
          !isChild && row.getCanExpand() && h(UButton, {
            color: "neutral",
            variant: "ghost",
            size: "xs",
            icon: row.getIsExpanded() ? "i-lucide-chevron-down" : "i-lucide-chevron-right",
            ui: {
              base: "p-0 rounded-sm",
              leadingIcon: "size-4"
            },
            onClick: row.getToggleExpandedHandler()
          }),
          h("div", {
            class: isChild ? "text-sm text-muted" : "font-semibold text-highlighted"
          }, row.original.name)
        ]
      );
    },
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Start Date",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-chevron-up"
            : "i-lucide-chevron-down"
          : "i-lucide-chevron-up",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
    cell: ({ row }) => {
      if (row.original.isChild) return h("div", {}, "—");
      const date = new Date(row.getValue("start_date"));
      return h("div", {}, date.toLocaleDateString());
    },
  },
  {
    accessorKey: "end_date",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "End Date",
        icon: isSorted
          ? isSorted === "asc"
            ? "i-lucide-chevron-up"
            : "i-lucide-chevron-down"
          : "i-lucide-chevron-up",
        class: "-mx-2.5",
        onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
      });
    },
    cell: ({ row }) => {
      if (row.original.isChild) return h("div", {}, "—");
      const date = new Date(row.getValue("end_date"));
      return h("div", {}, date.toLocaleDateString());
    },
  },
  {
    accessorKey: "meeting_id",
    header: "Meeting ID",
    cell: ({ row }) => {
      const meetingId = row.original.meeting_id;
      return h("div", { class: "font-mono text-sm" }, meetingId || "—");
    },
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      if (row.original.isChild) return h("div", {}, "—");
      const isActive = row.getValue("is_active");
      return h(UBadge, { variant: "subtle", color: isActive ? "success" : "neutral" }, () =>
        isActive ? "Active" : "Inactive"
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      if (row.original.isChild) return h("div", {});

      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end'
            },
            items: getRowItems(row),
            'aria-label': 'Actions dropdown'
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto',
              'aria-label': 'Actions dropdown'
            })
        )
      )
    },
  }
];

function getRowItems(row) {
  const isActive = row.original.is_active;
  const cohortName = row.original.name;

  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      type: "separator",
    },
    {
      label: isActive ? "Set Inactive" : "Set Active",
      onSelect: () => {
        emit('toggleStatus', { cohortName, isActive: !isActive });
      },
    },
  ];
}
</script>

<template>
    <UTable
      ref="table"
      v-model:expanded="expanded"
      :data="treeData"
      :columns="columns"
      :loading="loading"
      sticky
      v-model:sorting="sorting" 
      :get-sub-rows="(row) => row.children"
      :ui="{
        base: 'border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 h-10 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        tr: 'group',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default',
      }"
    />
</template>