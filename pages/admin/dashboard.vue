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
  const mockData = ref([
    {
      id: 1,
      status: "On Track",
      username: "johndoe",
      program: "Web Development",
      cohort: "Cohort 1",
      isActive: true,
      profileImgUrl: "",
      name: "John Doe",
      email: "john@example.com",
    },
    {
      id: 2,
      status: "Behind",
      username: "janesmith",
      program: "Web Development",
      cohort: "Cohort 1",
      isActive: true,
      profileImgUrl: "",
      name: "Jane Smith",
      email: "jane@example.com",
    },
  ])

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

  const toggleStudentActiveStatus = async (studentId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("students")
        .update({ is_active: !currentStatus })
        .eq("id", studentId);

      if (error) {
        console.error("Error updating student status:", error);
        return;
      }

      // Refresh the students list after update
      await fetchStudents();
    } catch (err) {
      console.error("Failed to toggle student status:", err);
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

    // show all students (both active and inactive)
    data.value = (students || [])
      .map((s) => ({
        id: s.id,
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
                icon="i-lucide-users"
                icon-color="info"
                :change="snapshotChange?.total_change"
                rounded-class="rounded-lg xl:rounded-none xl:rounded-l-lg"
              />

              <StudentStatCard
                title="ON TRACK"
                :count="data.filter((item) => item.status === 'On Track').length"
                icon="i-lucide-check-circle"
                icon-color="success"
                :change="snapshotChange?.on_track_change"
                :percent-change="snapshotChange?.on_track_pct_change"
              />

              <StudentStatCard
                title="BEHIND"
                :count="data.filter((item) => item.status === 'Behind').length"
                icon="i-lucide-triangle-alert"
                icon-color="error"
                :change="snapshotChange?.behind_change"
                :percent-change="snapshotChange?.behind_pct_change"
                :invert-colors="true"
              />

              <StudentStatCard
                title="AHEAD"
                :count="data.filter((item) => item.status === 'Ahead').length"
                icon="i-lucide-party-popper"
                icon-color="info"
                :change="snapshotChange?.ahead_change"
                :percent-change="snapshotChange?.ahead_pct_change"
                rounded-class="rounded-lg xl:rounded-none xl:rounded-r-lg"
              />
            </UPageGrid>
       

            <StudentsTable
              :data="data"
              :loading="loading"
              @toggle-active-status="toggleStudentActiveStatus"
            />
        </template>
    </UDashboardPanel>
</template>
