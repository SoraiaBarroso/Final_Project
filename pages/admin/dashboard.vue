<script setup>
// Page that cannot be accessed without authentication  and has logic to log-out a user.
definePageMeta({
  layout: 'default',
  middleware: ['role', 'auth'] // check if user has the right role and is authenticated 
});

import { onMounted, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const supabase = useSupabaseClient()
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')

const data = ref([])
const snapshotChange = ref(null)
const loading = ref(true)

const getSnapshotChange = async () => {
  const { data } = await useFetch('/api/snapshot');
  snapshotChange.value = data.value;
  console.log("Snapshot change data:", snapshotChange.value);
  return snapshotChange.value;
};

const fetchStudents = async () => {
  const { data: students, error } = await supabase
    .from('students')
    .select(`
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
  `)

  console.log("Fetched students:", students)

  if (error) {
    console.error('Error fetching students:', error)
    loading.value = false
    return
  }

  // only show students which are active
  data.value = (students || [])
    .filter((s) => s.is_active)
    .map((s) => ({
      status: s.status,
      name: `${s.first_name} ${s.last_name}`,
      email: s.email,
      program: s.programs?.name || '',
      username: s.username || '',
      cohort: s.cohorts?.name || '',
      isActive: s.is_active,
      profileImgUrl: s.profile_image_url || ''
    }))

  loading.value = false
}

onMounted(async () => {
  await getSnapshotChange();
  await fetchStudents();
})

const columns = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      const isSorted = column.getIsSorted()

      return h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        label: 'Name',
        icon: isSorted
          ? isSorted === 'asc'
            ? 'i-lucide-chevron-up'
            : 'i-lucide-chevron-down'
          : 'i-lucide-chevron-up',
        class: '-mx-2.5',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc')
      })
    },
    cell: ({ row }) => {
      const imgUrl = row.original.profileImgUrl;
      console.log('Avatar URL:', row.original.profileImgUrl);
      return h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: imgUrl,
          size: 'lg',
          alt: 'User Avatar'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted' }, row.original.name),
          h('p', { class: '' }, `@${row.original.username}`)
        ])
      ])
    }
  },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'program', header: 'Program' },
  { accessorKey: 'cohort', header: 'Cohort' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const color = {
        'On Track': 'success',
        'Behind': 'error',
        'Ahead': 'info'
      }[row.getValue('status')] || 'neutral'

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        row.getValue('status')
      )
    }
  },
]

const table = useTemplateRef('table')

const columnFilters = ref([
  { id: 'name', value: '' },
  { id: 'status', value: '' }
])

const pagination = ref({
  pageIndex: 0,
  pageSize: 5
})

const sorting = ref([
  {
    id: 'name',
    desc: false
  }
])

const statusFilter = ref('all')

watch(() => statusFilter.value, (newVal) => {
  if (!table?.value?.tableApi) return

  const statusColumn = table.value.tableApi.getColumn('status')
  if (!statusColumn) return

  if (newVal === 'all') {
    statusColumn.setFilterValue(undefined)
  } else {
    statusColumn.setFilterValue(newVal)
  }
})
</script>

<template>
   <div class="flex flex-col justify-center h-auto gap-6 px-10 my-6">    
      <div class="grid grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-2 lg:gap-4 lg:grid-cols-2 lg:grid-rows-2 xl:grid-cols-4 xl:grid-rows-1 gap-4 sm:gap-6 xl:gap-px">
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
              <div class="w-8 h-8 rounded-full bg-info/10 border border-info flex items-center justify-center">
                <UIcon name="i-lucide-users" class="size-4 text-info text-currentColor" />
              </div>
            </template>

            <p class="text-xs text-muted font-semibold">STUDENTS</p>

            <template #footer>
              <p class="text-black font-bold text-2xl m-0 flex items-center">
                {{ data.length }}
                <UBadge variant="outline" v-if="snapshotChange && snapshotChange.total_change !== undefined" :color="snapshotChange.total_change > 0 ? 'success' : snapshotChange.total_change < 0 ? 'error' : 'neutral'" class="ml-3 mt-[2px]">
                  {{ snapshotChange.total_change > 0 ? '+' : '' }}{{ snapshotChange.total_change }}
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
              <div class="w-8 h-8 rounded-full bg-success/10 border border-success flex items-center justify-center">
                <UIcon name="i-lucide-check-circle" class="size-4 text-success text-currentColor" />
              </div>
            </template>

            <p class="text-xs text-muted font-semibold">ON TRACK</p>

            <template #footer>
              <p class="text-black font-bold text-2xl m-0 flex items-center">
                {{ data.filter(item => item.status === 'On Track').length }}
                <UBadge :class="snapshotChange && snapshotChange.on_track_change !== undefined ? (snapshotChange.on_track_change > 0 ? 'bg-success/10 border-success' : snapshotChange.on_track_change < 0 ? 'bg-error/10 border-error' : 'bg-neutral/10 border-neutral') : ''" variant="outline" v-if="snapshotChange && snapshotChange.on_track_change !== undefined" :color="snapshotChange.on_track_change > 0 ? 'success' : snapshotChange.on_track_change < 0 ? 'error' : 'neutral'" class="ml-3 mt-[2px]">
                  {{ snapshotChange.on_track_change > 0 ? '+' : '' }}{{ snapshotChange.on_track_change }}
                  <span v-if="snapshotChange.on_track_pct_change !== null"> ({{ Math.abs(snapshotChange.on_track_pct_change).toFixed(1) }}%)</span>
                  <span v-else> (new)</span>
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
              <div class="w-8 h-8 rounded-full bg-error/10 border border-error flex items-center justify-center">
                <UIcon name="i-lucide-triangle-alert" class="size-4 text-error text-currentColor" />
              </div>
            </template>

            <p class="text-xs text-muted font-semibold">BEHIND</p>

            <template #footer>
              <p class="text-black font-bold text-2xl m-0 flex items-center">
                {{ data.filter(item => item.status === 'Behind').length }}
                <UBadge :class="snapshotChange && snapshotChange.behind_change !== undefined ? (snapshotChange.behind_change > 0 ? 'bg-error/10 border-error' : snapshotChange.behind_change < 0 ? 'bg-success/10 border-success' : 'bg-neutral/10 border-neutral') : ''" variant="outline" v-if="snapshotChange && snapshotChange.behind_change !== undefined" :color="snapshotChange.behind_change > 0 ? 'error' : snapshotChange.behind_change < 0 ? 'success' : 'neutral'" class="ml-3 mt-[2px]">
                  {{ snapshotChange.behind_change > 0 ? '+' : '' }}{{ snapshotChange.behind_change }}
                  <span v-if="snapshotChange.behind_pct_change !== null"> ({{ Math.abs(snapshotChange.behind_pct_change).toFixed(1) }}%)</span>
                  <span v-else> (new)</span>
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
              <div class="w-8 h-8 rounded-full bg-info/10 border border-info flex items-center justify-center">
                <UIcon name="i-lucide-party-popper" class="size-4 text-info text-currentColor" />
              </div>
            </template>

            <p class="text-xs text-muted font-semibold">AHEAD</p>

            <template #footer>
              <p class="text-black font-bold text-2xl m-0 flex items-center">
                {{ data.filter(item => item.status === 'Ahead').length }}
                <UBadge :class="snapshotChange && snapshotChange.ahead_change !== undefined ? (snapshotChange.ahead_change > 0 ? 'bg-success/10 border-success' : snapshotChange.ahead_change < 0 ? 'bg-error/10 border-error' : 'bg-neutral/10 border-neutral') : ''" variant="outline" v-if="snapshotChange && snapshotChange.ahead_change !== undefined" :color="snapshotChange.ahead_change > 0 ? 'success' : snapshotChange.ahead_change < 0 ? 'error' : 'neutral'" class="ml-3 mt-[2px]">
                  {{ snapshotChange.ahead_change > 0 ? '+' : '' }}{{ snapshotChange.ahead_change }}
                  <span v-if="snapshotChange.ahead_pct_change !== null"> ({{ Math.abs(snapshotChange.ahead_pct_change).toFixed(1) }}%)</span>
                  <span v-else> (new)</span>
                </UBadge>
              </p>
            </template>
          </UCard>
      </div>

      <div class="flex flex-col min-h-[450px]">
          <div class="flex justify-between items-center w-full">
            <UInput
              size="md"
              color="info"
              icon="i-lucide-search"
              :model-value="table?.tableApi?.getColumn('name')?.getFilterValue()"
              class="max-w-sm"
              placeholder="Filter names..."
              @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
            />

            <USelect
              size="md"
              v-model="statusFilter"
              :items="[
                { label: 'All', value: 'all' },
                { label: 'On Track', value: 'on track' },
                { label: 'Behind', value: 'behind' },
                { label: 'Ahead', value: 'ahead' }
              ]"
              :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
              placeholder="Filter status"
              class="min-w-28"
            />
        </div>
      
      <UTable 
        sticky 
        ref="table" 
        v-model:column-filters="columnFilters" 
        v-model:pagination="pagination"
        v-model:sorting="sorting"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel()
        }"
        :loading="loading" 
        loading-color="primary" 
        loading-animation="carousel" 
        :data="data" 
        :columns="columns" 
        class="flex-1 mt-4" 
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 h-10 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />
      <div class="flex justify-between items-center border-t border-default pt-4">
        <p class="text-muted text-xs xl:text-sm">{{ table?.tableApi?.getFilteredRowModel().rows.length }} students</p>
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
    </div>
</template>