<script setup lang="ts">
  // Page on which authentication will be performed.
  definePageMeta({
    layout: false,
    middleware: ["guest"],
  });

  const supabase = useSupabaseClient();
  const route = useRoute();
  const isErrorVisible = ref(false);

  supabase.auth.onAuthStateChange((event, session) => {
    console.log("Auth state changed:", event, session);
    if (session && session.provider_token) {
      window.localStorage.setItem("oauth_provider_token", session.provider_token);
    }
    if (session && session.provider_refresh_token) {
      window.localStorage.setItem("oauth_provider_refresh_token", session.provider_refresh_token);
    }
    if (event === "SIGNED_OUT") {
      window.localStorage.removeItem("oauth_provider_token");
      window.localStorage.removeItem("oauth_provider_refresh_token");
    }
  });

  const signInWithOAuth = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar.readonly",
        redirectTo: "http://localhost:3000/auth/confirm", // Redirect to confirm page after authentication
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) {
      console.log("Authentication error:", error);
      navigateTo("/?error=domain");
    }
  };

  watch(
    () => route,
    () => {
      if (route.query.error === "domain") {
        isErrorVisible.value = true;
      }
    },
    { immediate: true }
  );
</script>

<template>
  <div class="flex h-screen flex-col items-center justify-center gap-6">
    <UAlert
      v-if="isErrorVisible"
      color="neutral"
      variant="subtle"
      title="Authentication Error"
      description="Please use your university email address to sign in."
      icon="i-lucide-circle-alert"
      class="absolute top-4 w-[35%]"
      :close="{
        color: 'error',
        variant: 'outline',
        class: 'rounded-full cursor-pointer',
        onClick: () => {
          isErrorVisible = false;
        },
      }"
    />
    <div class="flex flex-col items-center justify-center gap-2">
      <UIcon name="i-lucide-user" class="size-8" />
      <h1 class="text-highlighted text-xl font-semibold text-pretty">Login</h1>
      <p class="text-muted text-base text-pretty">Enter your credentials to access your account.</p>
    </div>
    <div class="flex w-[35%] items-center justify-center">
      <UButton
        @click="signInWithOAuth"
        class="flex w-full cursor-pointer items-center justify-center"
        icon="i-simple-icons-google"
        color="neutral"
        variant="outline"
        >Google</UButton
      >
    </div>
  </div>
</template>
