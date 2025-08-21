<script setup lang="ts">
// Page on which authentication will be performed. 
definePageMeta({
  layout: false,
  middleware: ["guest"]
})

const supabase = useSupabaseClient()
const route = useRoute()
const isErrorVisible = ref(false)

const signInWithOAuth = async () => {
    console.log("Signing in with OAuth for email:")
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          scopes: 'https://www.googleapis.com/auth/calendar.readonly',
          redirectTo: 'http://localhost:3000/auth/confirm' // Redirect to confirm page after authentication
        }
    })
    if (error) {
        console.log("Authentication error:", error);
        navigateTo('/?error=domain');
    } else {
        console.log("User signed in successfully (or will be redirected to confirm page)");
    }
}

watch(() => route, () => {
    if (route.query.error === 'domain') {
      isErrorVisible.value = true;
    }
}, { immediate: true })

onMounted(async () => {
    // This page is for performing authentication
    console.log("Authentication page loaded");
    // Force clear any cached layout
    // clearNuxtData();
    // await nextTick();
});
</script>

 
<template>
  <div class="gap-6 flex flex-col items-center justify-center h-screen">
    <UAlert
      v-if="isErrorVisible"
      color="neutral"
      variant="subtle"
      title="Authentication Error"
      description="Please use your university email address to sign in."
      icon="i-lucide-circle-alert"
      class="w-[35%] absolute top-4"
      :close="{
        color: 'error',
        variant: 'outline',
        class: 'rounded-full cursor-pointer',
        onClick: () => { isErrorVisible = false }
      }"
    />
    <div class="flex justify-center items-center flex-col gap-2">
        <UIcon name="i-lucide-user" class="size-8"/>
        <h1 class="text-xl text-pretty font-semibold text-highlighted">Login</h1>
        <p class="text-base text-pretty text-muted">Enter your credentials to access your account.</p>
    </div>
    <div class="w-[35%] flex justify-center items-center">
        <UButton @click="signInWithOAuth" class="w-full flex justify-center items-center cursor-pointer" icon="i-simple-icons-google" color="neutral" variant="outline">Google</UButton>
    </div>
  </div>
</template>