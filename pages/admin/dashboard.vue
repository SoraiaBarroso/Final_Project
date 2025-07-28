<script setup>
// Page that cannot be accessed without authentication  and has logic to log-out a user.
import { onMounted, resolveComponent } from 'vue'

const supabase = useSupabaseClient()
const UBadge = resolveComponent('UBadge')

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
      cohorts(name),
      programs(name)
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
    cohort: s.cohorts?.name || '',
    isActive: s.is_active
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
  { accessorKey: 'name', header: 'Full Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'program', header: 'Program' },
  { accessorKey: 'cohort', header: 'Cohort' }
]
</script>

<template>
   <div v-if="!loadingPage" class="flex flex-col items-center justify-center h-screen gap-4">
        <h1>secure page</h1>
        <UTable sticky="" :loading="loading" loading-color="primary" loading-animation="carousel" :data="data" :columns="columns" class=" min-h-[400px] max-h-[400px]" />
    </div>
</template>