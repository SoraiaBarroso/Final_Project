// This is the gatekeeper for all protected pages. It ensures a user is logged in.
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
    console.log("Auth middleware triggered");
    const user = useSupabaseUser();

    if (!user.value) {
        // If the user is not logged in, redirect them to the login page.
        return navigateTo('/'); 
    }
});