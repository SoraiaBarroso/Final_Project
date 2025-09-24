// This middleware checks if the user has the required role to access certain routes
export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log("Auth middleware triggered");
  const user = useSupabaseUser();

  const adminRoutes = ["/admin", "/admin/dashboard"];

  const { role } = await $fetch("/api/user/role");

  if (adminRoutes.includes(to.path) && role !== "admin") {
    return navigateTo("/students/dashboard");
  }
});
