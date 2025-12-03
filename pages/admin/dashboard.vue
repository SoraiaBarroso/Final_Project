<script setup>
  import { onMounted } from "vue";

  // Page that cannot be accessed without authentication and has logic to log-out a user.
  definePageMeta({
    layout: "default",
    middleware: ["admin"], // check if user has admin role (auth is checked globally)
  });

  const supabase = useSupabaseClient();

  const data = ref([]);
  const snapshotChange = ref(null);
  const loading = ref(true);
  
  const getSnapshotChange = async () => {
    try {
      const res = await $fetch("/api/snapshot");
      // some handlers return { data: { value } } while others may return the value directly
      const payload = res?.data?.value ?? res?.data ?? res
      snapshotChange.value = payload;
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
      account_status,
      username,
      cohorts(name),
      programs(name),
      points_assigned,
      profile_image_url
  `);

    if (error) {
      console.error("Error fetching students:", error);
      loading.value = false;
      return;
    }

    // show all students (both active and inactive)
    data.value = (students || [])
      .map((s) => ({
        id: s.id,
        status: s.status || "Unknown",
        name: `${s.first_name} ${s.last_name}`,
        email: s.email,
        program: s.programs?.name || "",
        username: s.username || "",
        cohort: s.cohorts?.name || "",
        accountStatus: s.account_status || 'Active',
        points_assigned: s.points_assigned || 0,
        profileImgUrl: s.profile_image_url || "",
      }));

    console.log("Processed student data for table:", data.value);
    loading.value = false;
  };

  onMounted(async () => {
    console.log("Admin dashboard mounted");
    await getSnapshotChange();
    await fetchStudents();
  });
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
            <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
                <StudentStatCard
                title="STUDENTS"
                :count="data.length"
                icon="i-pajamas:users"
                icon-color="info"
                :change="snapshotChange?.total_change"
                rounded-class="rounded-lg xl:rounded-none xl:rounded-l-lg lg:rounded-r-none"
              />

              <StudentStatCard
                title="ON TRACK"
                :count="data.filter((item) => item.status === 'On Track').length"
                icon="i-pajamas:partner-verified"
                icon-color="success"
                :change="snapshotChange?.on_track_change"
                :percent-change="snapshotChange?.on_track_pct_change"
                rounded-class="rounded-lg xl:rounded-none lg:rounded-none"
              />

              <StudentStatCard
                title="MONITOR"
                :count="data.filter((item) => item.status === 'Monitor').length"
                icon="i-pajamas:warning"
                icon-color="warning"
                :change="snapshotChange?.monitor_change"
                :invert-colors="true"
                :percent-change="snapshotChange?.monitor_pct_change"
                rounded-class="rounded-lg xl:rounded-none xl:rounded-r-none lg:rounded-none"
              />

              <StudentStatCard
                title="AT RISK"
                :count="data.filter((item) => item.status === 'At Risk').length"
                icon="i-pajamas:status-alert"
                icon-color="error"
                :invert-colors="true"
                :change="snapshotChange?.at_risk_change"
                :percent-change="snapshotChange?.at_risk_pct_change"
                rounded-class="rounded-lg xl:rounded-r-lg lg:rounded-r-lg lg:rounded-l-none"
              />
            </UPageGrid>
       

            <StudentsTable
              :data="data"
              :loading="loading"
              @refresh-data="fetchStudents"
            />
        </template>
    </UDashboardPanel>
</template>
