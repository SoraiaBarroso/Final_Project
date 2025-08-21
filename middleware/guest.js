// middleware/guest.ts
// will run on pages that should only be visible to unauthenticated users, like your login page.
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser();

  if (user.value) {
    // Redirect to a default authenticated page. The role-specific
    // middleware there will handle the final destination.
    return navigateTo('/students/student_data'); 
  }
});