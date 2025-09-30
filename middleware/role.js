// This middleware checks if the user has the required role to access certain routes
export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log("Role middleware triggered");
  const user = useSupabaseUser();
  const supabase = useSupabaseClient();

  // Only run on client-side or if user exists
  if (!user.value) {
    return;
  }

  const adminRoutes = ["/admin", "/admin/dashboard"];
  
  // Only check role for admin routes
  if (!adminRoutes.includes(to.path)) {
    return;
  }

  try {
    // Check if the user is in the 'admin' table directly using the client
    const { data: adminData, error: adminError } = await supabase
      .from("admin")
      .select("email")
      .eq("email", user.value.email)
      .single();

    if (adminError && adminError.code !== "PGRST116") {
      console.error("Error fetching admin role:", adminError);
      // On error, redirect to student dashboard for safety
      return navigateTo("/students/dashboard");
    }

    // If user is not an admin and trying to access admin routes, redirect
    if (!adminData) {
      return navigateTo("/students/dashboard");
    }
  } catch (error) {
    console.error("Role check failed:", error);
    return navigateTo("/students/dashboard");
  }
});
