<script setup>
// Page that cannot be accessed without authentication  and has logic to log-out a user.
import { onMounted } from 'vue'

const supabase = useSupabaseClient()

function enableCustomLayout (layout) {
  setPageLayout(layout)
}

definePageMeta({
  layout: false,
});


onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    navigateTo('/index');
    return;
  }

  // 1. Check admin table
  const { data: adminData, error: adminError } = await supabase
    .from('admin')
    .select('role')
    .eq('email', user.email)
    .single();

  if (adminData && adminData.role === 'admin') {
    console.log("Admin user detected, setting layout to default");
    setPageLayout('default');
    return;
  }

  // 2. Check students table
  const { data: studentData, error: studentError } = await supabase
    .from('students')
    .select('role')
    .eq('email', user.email)
    .single();

  if (studentData && studentData.role === 'student') {
    console.log("Student user detected, setting layout to custom");
    setPageLayout('custom');
    return;
  }

  // 3. Not found in either table
  setPageLayout('custom');
})

const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) console.log(error)
  navigateTo('/index')
}
</script>

<template>
   <div class="flex flex-col items-center justify-center h-screen gap-4">
        <h1>secure page</h1>
        <UButton @click="signOut" color="neutral" variant="outline">Log Out</UButton>
    </div>
</template>