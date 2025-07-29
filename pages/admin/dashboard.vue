<script setup>
// Page that cannot be accessed without authentication  and has logic to log-out a user.
import { onMounted, resolveComponent } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'

const supabase = useSupabaseClient()
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')

const data = ref([])
const loading = ref(true)
const loadingPage = ref(true)
const userRole = useState('userRole')

definePageMeta({
  layout: false,
});

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

function getTimeRange(period = 'week') {
  const now = new Date();
  const timeMin = now.toISOString();

  let timeMax = new Date();

  if (period === 'week') {
    timeMax.setDate(timeMax.getDate() + 7); // 7 days from now
  } else if (period === 'month') {
    timeMax.setMonth(timeMax.getMonth() + 1); // 1 month from now
  }

  return {
    timeMin,
    timeMax: timeMax.toISOString(),
  };
}

// TODO DISPLAY EVENTS THIS WEEK
async function fetchCalendarEvents(accessToken, period = 'week') {
  const { timeMin, timeMax } = getTimeRange(period);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
      timeMin
    )}&timeMax=${encodeURIComponent(
      timeMax
    )}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await res.json();
  console.log("Fetched calendar events:", data.items)
  return data.items || [];
}

onMounted(async () => {
  console.log("User role on mount:", userRole.value)
  setPageLayout('default');
  loadingPage.value = false;
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.provider_token;
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  fetchCalendarEvents(accessToken)
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
          size: 'lg'
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
   <div v-if="!loadingPage" class="flex flex-col justify-end h-full gap-4 px-10 my-8">
      
      <div class="flex flex-col min-h-[450px]">
          <div class="flex justify-between items-center w-full">
            <UInput
              size="sm"
              color="info"
              icon="i-lucide-search"
              :model-value="table?.tableApi?.getColumn('name')?.getFilterValue()"
              class="max-w-sm"
              placeholder="Filter names..."
              @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
            />

            <USelect
              size="sm"
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
          thead: '[&>tr]:bg-elevated/50 h-12 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />
      <div class="flex justify-between items-center border-t border-default pt-4">
        <p class="text-muted text-sm">{{ table?.tableApi?.getFilteredRowModel().rows.length }} total students</p>
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