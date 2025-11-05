<script setup>
import { getPaginationRowModel } from "@tanstack/vue-table";
import { resolveComponent, ref, watch } from "vue";

const UBadge = resolveComponent("UBadge");
const UAvatar = resolveComponent("UAvatar");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

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

const emit = defineEmits(["toggleActiveStatus"]);

const table = useTemplateRef("table");

const columnFilters = ref([
  { id: "name", value: "" },
  { id: "status", value: "" },
]);

const pagination = ref({
  pageIndex: 0,
  pageSize: 7,
});

const sorting = ref([
  {
    id: "name",
    desc: false,
  },
]);

const statusFilter = ref("");
const programFilter = ref("");
const cohortFilter = ref("");
const cohortItems = ref([]);

watch(
  () => props.data,
  (newData) => {
    const cohorts = [...new Set(newData.map(item => item.cohort))];
    cohortItems.value = cohorts.map(cohort => ({
      label: cohort,
      value: cohort,
    }));
    cohortItems.value.unshift({ label: 'All', value: 'all' });
    console.log("Cohort items updated:", cohortItems.value);
  },
  { immediate: true }
);

watch(
  () => cohortFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return;

    const cohortColumn = table.value.tableApi.getColumn("cohort");
    if (!cohortColumn) return;

    if (newVal === "all") {
      cohortColumn.setFilterValue(undefined);
    } else {
      cohortColumn.setFilterValue(newVal);
    }
  }
);

watch(
  () => programFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return;

    const programColumn = table.value.tableApi.getColumn("program");
    if (!programColumn) return;

    if (newVal === "all") {
      programColumn.setFilterValue(undefined);
    } else {
      programColumn.setFilterValue(newVal);
    }
  }
);

watch(
  () => statusFilter.value,
  (newVal) => {
    if (!table?.value?.tableApi) return;

    const statusColumn = table.value.tableApi.getColumn("status");
    if (!statusColumn) return;

    if (newVal === "all") {
      statusColumn.setFilterValue(undefined);
    } else {
      statusColumn.setFilterValue(newVal);
    }
  }
);

const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return h(UButton, {
        color: "neutral",
        variant: "ghost",
        label: "Name",
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
      const imgUrl = row.original.profileImgUrl;
      return h("div", { class: "flex items-center gap-3" }, [
        h(UAvatar, {
          src: imgUrl,
          size: "lg",
          alt: "User Avatar",
        }),
        h("div", undefined, [
          h("p", { class: "font-medium text-highlighted" }, row.original.name),
          h("p", { class: "" }, `@${row.original.username}`),
        ]),
      ]);
    },
  },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "program", header: "Program" },
  { accessorKey: "cohort", header: "Cohort" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const color =
        {
          "On Track": "success",
          "At Risk": "error",
          "Monitor": "warning",
        }[row.getValue("status")] || "neutral";

      return h(UBadge, { class: "capitalize", variant: "subtle", color }, () =>
        row.getValue("status")
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Is Active",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return h(UBadge, { variant: "subtle", color: isActive ? "success" : "neutral" }, () =>
        isActive ? "Active" : "Inactive"
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
            "aria-label": "Actions dropdown",
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
              "aria-label": "Actions dropdown",
            })
        )
      );
    },
  },
];

function getRowItems(row) {
  const isActive = row.original.is_active;

  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      type: "separator",
    },
    {
      label: "View student",
      onSelect: () => {
        useRouter().push(`/admin/students/${row.original.id}`);
      },
    },
    {
      label: isActive ? "Set Inactive" : "Set Active",
      onSelect: () => {
        emit("toggleActiveStatus", row.original.id, isActive);
      },
    },
  ];
}
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <div class="flex w-full items-center justify-between">
      <UInput
        size="md"
        color="info"
        icon="i-lucide-search"
        :model-value="table?.tableApi?.getColumn('name')?.getFilterValue()"
        class="min-w-58"
        placeholder="Filter names..."
        @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
      />

      <div class="flex items-center gap-4">
        <USelect
          size="md"
          v-model="cohortFilter"
          :items="cohortItems"
          :ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
          }"
          placeholder="Filter cohort"
          class="min-w-52"
        />

        <USelect
          size="md"
          v-model="programFilter"
          :items="[
            { label: 'All', value: 'all' },
            { label: 'Software Engineering', value: 'Software Engineering' },
            { label: 'Data Science', value: 'Data Science' },
            { label: 'AI/ML', value: 'AI/ML' },
          ]"
          :ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
          }"
          placeholder="Filter program"
          class="min-w-52"
        />

        <USelect
          size="md"
          v-model="statusFilter"
          :items="[
            { label: 'All', value: 'all', chip },
            { label: 'On Track', value: 'on track', chip: { color: 'success' } },
            { label: 'At Risk', value: 'at risk', chip: { color: 'error' } },
            { label: 'Monitor', value: 'monitor', chip: { color: 'warning' } },
          ]"
          :ui="{
            trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
          }"
          placeholder="Filter status"
          class="min-w-52"
        />
      </div>
    </div>

    <UTable
      sticky
      ref="table"
      v-model:column-filters="columnFilters"
      v-model:pagination="pagination"
      v-model:sorting="sorting"
      :pagination-options="{
        getPaginationRowModel: getPaginationRowModel(),
      }"
      :loading="loading"
      loading-color="primary"
      loading-animation="carousel"
      :data="data"
      :columns="columns"
      class="mt-4 flex-1"
      :ui="{
        base: 'border-separate border-spacing-0',
        thead: '[&>tr]:bg-elevated/50 h-10 [&>tr]:after:content-none',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
        td: 'border-b border-default',
      }"
    />
    <div class="border-default flex items-center justify-between border-t pt-4">
      <p class="text-muted text-xs xl:text-sm">
        {{ table?.tableApi?.getFilteredRowModel().rows.length }} students
      </p>
      <UPagination
        variant="subtle"
        active-color="primary"
        :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
        :items-per-page="table?.tableApi?.getState().pagination.pageSize"
        :total="table?.tableApi?.getFilteredRowModel().rows.length"
        @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
      />
    </div>
  </div>
</template>
