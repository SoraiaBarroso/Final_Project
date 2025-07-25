// Middleware that'll keep checking that the user isn't able to access the login page after logging in / signing in.
export default defineNuxtRouteMiddleware(() => {
    const user = useSupabaseUser()
     
    if (user.value) {
        console.log("User is logged in, redirecting to secures page.")
        console.log(user.value)
        return navigateTo('/dashboard')
    }
})