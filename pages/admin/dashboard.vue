<script setup>
// Page that cannot be accessed without authentication  and has logic to log-out a user.
import { onMounted, resolveComponent } from 'vue'

const supabase = useSupabaseClient()
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

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

  data.value = (students || []).map((s) => ({
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
    header: 'Name',
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
   <div v-if="!loadingPage" class="flex-1 flex-col items-center justify-center h-screen gap-4 px-10">
      <h1>secure page</h1>
      <div class="flex justify-between items-center w-full mt-20">
          <UInput
            icon="i-lucide-search"
            :model-value="table?.tableApi?.getColumn('name')?.getFilterValue()"
            class="max-w-sm"
            placeholder="Filter names..."
            @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
          />

          <USelect
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
        :loading="loading" 
        loading-color="primary" 
        loading-animation="carousel" 
        :data="data" 
        :columns="columns" 
        class="min-h-[400px] max-h-[400px] mt-4" 
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 h-12 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default'
        }"
      />
    </div>
</template>