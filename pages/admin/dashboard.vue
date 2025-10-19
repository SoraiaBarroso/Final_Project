<script setup>
  import { getPaginationRowModel } from "@tanstack/vue-table";
  import { onMounted, resolveComponent } from "vue";

  // Page that cannot be accessed without authentication and has logic to log-out a user.
  definePageMeta({
    layout: "default",
    middleware: ["admin"], // check if user has admin role (auth is checked globally)
  });

  const supabase = useSupabaseClient();
  const UBadge = resolveComponent("UBadge");
  const UAvatar = resolveComponent("UAvatar");
  const UDropdownMenu = resolveComponent('UDropdownMenu')
  const UButton = resolveComponent('UButton')

  const data = ref([]);
  const snapshotChange = ref(null);
  const loading = ref(true);

  const getSnapshotChange = async () => {
    try {
      const res = await $fetch("/api/snapshot");
      // some handlers return { data: { value } } while others may return the value directly
      const payload = res?.data?.value ?? res?.data ?? res
      console.log("Raw snapshot payload:", payload);
      snapshotChange.value = payload;
      console.log("Snapshot change data:", snapshotChange.value);
      return snapshotChange.value;
    } catch (err) {
      console.error('Failed to fetch snapshot:', err);
      snapshotChange.value = null;
      return null;
    }
  };

  const fetchStudents = async () => {
    const { data: students, error } = await supabase.from("students").select(`
      id,
      first_name,
      last_name,
      email,
      status,
      is_active,
      username,
      cohorts(name),
      programs(name),
      profile_image_url 
  `);

    console.log("Fetched students:", students);

    if (error) {
      console.error("Error fetching students:", error);
      loading.value = false;
      return;
    }

    // only show students which are active
    data.value = (students || [])
      .filter((s) => s.is_active)
      .map((s) => ({
        status: s.status,
        name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        program: s.programs?.name || "",
        username: s.username || "",
        cohort: s.cohorts?.name || "",
        isActive: s.is_active,
        profileImgUrl: s.profile_image_url || "",
      }));

    loading.value = false;
  };

  onMounted(async () => {
    console.log("Admin dashboard mounted");
    await getSnapshotChange();
    await fetchStudents();
  });

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
        console.log("Avatar URL:", row.original.profileImgUrl);
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
            Behind: "error",
            Ahead: "info",
          }[row.getValue("status")] || "neutral";

        return h(UBadge, { class: "capitalize", variant: "subtle", color }, () =>
          row.getValue("status")
        );
      },
    },
    {
      id: "actions",
       cell: ({ row }) => {
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
    }
    }
  ];

function getRowItems(row) {
  return [
    {
      type: 'label',
      label: 'Actions'
    },
    {
      type: 'separator'
    },
    {
      label: 'View student',
      onSelect: () => {
        useRouter().push(`/admin/students/${studentId}`);
      }
    },
  ]
}
  const table = useTemplateRef("table");

  const columnFilters = ref([
    { id: "name", value: "" },
    { id: "status", value: "" },
  ]);

  const pagination = ref({
    pageIndex: 0,
    pageSize: 6,
  });

  const sorting = ref([
    {
      id: "name",
      desc: false,
    },
  ]);

  const statusFilter = ref("");
  const programFilter = ref("");

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
</script>

<template>
     <UDashboardPanel id="home">
        <template #header>
            <UDashboardNavbar title="Dashboard" >
                <template #leading>
                    <UDashboardSidebarCollapse />
                </template>
            </UDashboardNavbar>
        </template>

        <template #body>
            <div class="grid grid-cols-1 grid-rows-2 gap-4 sm:gap-6 md:grid-cols-2 md:grid-rows-2 lg:grid-cols-2 lg:grid-rows-2 lg:gap-4 xl:grid-cols-4 xl:grid-rows-1 xl:gap-px"
            > 
              <UCard
                variant="subtle"
                :ui="{
                  root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none xl:rounded-l-lg hover:bg-elevated cursor-pointer',
                  body: 'border-none px-4 xl:!px-6 !py-0',
                  header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
                  footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6',
                }"
              >
                <template #header>
                  <div
                    class="bg-info/10 border-info flex h-8 w-8 items-center justify-center rounded-full border"
                  >
                    <UIcon name="i-lucide-users" class="text-info text-currentColor size-4" />
                  </div>
                </template>

                <p class="text-muted text-xs font-semibold">STUDENTS</p>

                <template #footer>
                  <p class="m-0 flex items-center text-2xl font-bold text-black">
                    {{ data.length }}
                    <UBadge
                      variant="outline"
                      v-if="snapshotChange && snapshotChange.total_change !== undefined"
                      :color="
                        snapshotChange.total_change > 0
                          ? 'success'
                          : snapshotChange.total_change < 0
                            ? 'error'
                            : 'neutral'
                      "
                      class="mt-[3px] ml-3"
                    >
                      <span v-if="snapshotChange.total_change === 0"><UIcon name="i-lucide-minus" /></span>
                      <span v-else>{{ snapshotChange.total_change > 0 ? '+' : '' }}{{ snapshotChange.total_change }}</span>
                    </UBadge>
                  </p>
                </template>
              </UCard>
              <UCard
                variant="subtle"
                :ui="{
                  root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none hover:bg-elevated cursor-pointer',
                  body: 'border-none px-4 xl:!px-6 !py-0',
                  header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
                  footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6 flex items-center justify-start gap-2',
                }"
              >
                <template #header>
                  <div
                    class="bg-success/10 border-success flex h-8 w-8 items-center justify-center rounded-full border"
                  >
                    <UIcon name="i-lucide-check-circle" class="text-success text-currentColor size-4" />
                  </div>
                </template>

                <p class="text-muted text-xs font-semibold">ON TRACK</p>

                <template #footer>
                  <p class="m-0 flex items-center text-2xl font-bold text-black">
                    {{ data.filter((item) => item.status === "On Track").length }}
                    <UBadge
                      :class="
                        snapshotChange && snapshotChange.on_track_change !== undefined
                          ? snapshotChange.on_track_change > 0
                            ? 'bg-success/10 border-success'
                            : snapshotChange.on_track_change < 0
                              ? 'bg-error/10 border-error'
                              : 'bg-neutral/10 border-neutral'
                          : ''
                      "
                      variant="outline"
                      v-if="snapshotChange && snapshotChange.on_track_change !== undefined"
                      :color="
                        snapshotChange.on_track_change > 0
                          ? 'success'
                          : snapshotChange.on_track_change < 0
                            ? 'error'
                            : 'neutral'
                      "
                      class="mt-[2px] ml-3"
                    >
                      <span v-if="snapshotChange.on_track_change === 0"><UIcon name="i-lucide-minus"/></span>
                      <span v-else>
                        {{ snapshotChange.on_track_change > 0 ? '+' : '' }}{{ snapshotChange.on_track_change }}
                        <span v-if="snapshotChange.on_track_pct_change !== null">
                          ({{ Math.abs(snapshotChange.on_track_pct_change).toFixed(1) }}%)
                        </span>
                        <span v-else> (new)</span>
                      </span>
                    </UBadge>
                  </p>
                </template>
              </UCard>
              <UCard
                variant="subtle"
                :ui="{
                  root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none hover:bg-elevated cursor-pointer',
                  body: 'border-none px-4 xl:!px-6 !py-0',
                  header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
                  footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6 flex items-center justify-start gap-2',
                }"
              >
                <template #header>
                  <div
                    class="bg-error/10 border-error flex h-8 w-8 items-center justify-center rounded-full border"
                  >
                    <UIcon name="i-lucide-triangle-alert" class="text-error text-currentColor size-4" />
                  </div>
                </template>

                <p class="text-muted text-xs font-semibold">BEHIND</p>

                <template #footer>
                  <p class="m-0 flex items-center text-2xl font-bold text-black">
                    {{ data.filter((item) => item.status === "Behind").length }}
                    <UBadge
                      :class="
                        snapshotChange && snapshotChange.behind_change !== undefined
                          ? snapshotChange.behind_change > 0
                            ? 'bg-error/10 border-error'
                            : snapshotChange.behind_change < 0
                              ? 'bg-success/10 border-success'
                              : 'bg-neutral/10 border-neutral'
                          : ''
                      "
                      variant="outline"
                      v-if="snapshotChange && snapshotChange.behind_change !== undefined"
                      :color="
                        snapshotChange.behind_change > 0
                          ? 'error'
                          : snapshotChange.behind_change < 0
                            ? 'success'
                            : 'neutral'
                      "
                      class="mt-[2px] ml-3"
                    >
                      <span v-if="snapshotChange.behind_change === 0"><UIcon name="i-lucide-minus"/></span>
                      <span v-else>
                        {{ snapshotChange.behind_change > 0 ? '+' : '' }}{{ snapshotChange.behind_change }}
                        <span v-if="snapshotChange.behind_pct_change !== null">
                          ({{ Math.abs(snapshotChange.behind_pct_change).toFixed(1) }}%)
                        </span>
                        <span v-else> (new)</span>
                      </span>
                    </UBadge>
                  </p>
                </template>
              </UCard>
              <UCard
                variant="subtle"
                :ui="{
                  root: 'border-none py-1 h-30 xl:h-34 xl:!py-2 hover:ring-accented rounded-lg xl:rounded-none xl:rounded-r-lg hover:bg-elevated cursor-pointer',
                  body: 'border-none px-4 xl:!px-6 !py-0',
                  header: 'border-none xl:px-2 px-4 !py-3 xl:px-6',
                  footer: 'border-none xl:px-2 px-4 !py-1 xl:px-6 flex items-center justify-start gap-2',
                }"
              >
                <template #header>
                  <div
                    class="bg-info/10 border-info flex h-8 w-8 items-center justify-center rounded-full border"
                  >
                    <UIcon name="i-lucide-party-popper" class="text-info text-currentColor size-4" />
                  </div>
                </template>

                <p class="text-muted text-xs font-semibold">AHEAD</p>

                <template #footer>
                  <p class="m-0 flex items-center text-2xl font-bold text-black">
                    {{ data.filter((item) => item.status === "Ahead").length }}
                    <UBadge
                      :class="
                        snapshotChange && snapshotChange.ahead_change !== undefined
                          ? snapshotChange.ahead_change > 0
                            ? 'bg-success/10 border-success'
                            : snapshotChange.ahead_change < 0
                              ? 'bg-error/10 border-error'
                              : 'bg-neutral/10 border-neutral'
                          : ''
                      "
                      variant="outline"
                      v-if="snapshotChange && snapshotChange.ahead_change !== undefined"
                      :color="
                        snapshotChange.ahead_change > 0
                          ? 'success'
                          : snapshotChange.ahead_change < 0
                            ? 'error'
                            : 'neutral'
                      "
                      class="mt-[2px] ml-3"
                    >
                      <span v-if="snapshotChange.ahead_change === 0"><UIcon name="i-lucide-minus"/></span>
                      <span v-else>
                        {{ snapshotChange.ahead_change > 0 ? '+' : '' }}{{ snapshotChange.ahead_change }}
                        <span v-if="snapshotChange.ahead_pct_change !== null">
                          ({{ Math.abs(snapshotChange.ahead_pct_change).toFixed(1) }}%)
                        </span>
                        <span v-else> (new)</span>
                      </span>
                    </UBadge>
                  </p>
                </template>
              </UCard>
            </div>

            <div class="flex h-full w-full flex-col">
              <div class="flex w-full items-center justify-between">
                <UInput
                  size="md"
                  color="info"
                  icon="i-lucide-search"
                  :model-value="table?.tableApi?.getColumn('name')?.getFilterValue()"
                  class="max-w-sm"
                  placeholder="Filter names..."
                  @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
                />

                <div class="flex items-center gap-4">
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
                    class="min-w-28"
                  />

                  <USelect
                    size="md"
                    v-model="statusFilter"
                    :items="[
                      { label: 'All', value: 'all' },
                      { label: 'On Track', value: 'on track' },
                      { label: 'Behind', value: 'behind' },
                      { label: 'Ahead', value: 'ahead' },
                    ]"
                    :ui="{
                      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
                    }"
                    placeholder="Filter status"
                    class="min-w-28"
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
                  size="sm"
                  color="neutral"
                  active-color="info"
                  :default-page="(table?.tableApi?.getState().pagination.pageIndex || 0) + 1"
                  :items-per-page="table?.tableApi?.getState().pagination.pageSize"
                  :total="table?.tableApi?.getFilteredRowModel().rows.length"
                  @update:page="(p) => table?.tableApi?.setPageIndex(p - 1)"
                />
              </div>
            </div>
        </template>
    </UDashboardPanel>
</template>
