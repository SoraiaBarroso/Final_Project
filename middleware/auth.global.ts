import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app"

export default defineNuxtRouteMiddleware((to) => {
    const user = useSupabaseUser()

    // Allow access to public routes
    const publicRoutes = ["/", "/auth/confirm"]
    if (publicRoutes.includes(to.path)) {
        return
    }

    // Redirect to login if not authenticated
    if (!user.value) {
        console.log("User not authenticated, redirecting to login")
        return navigateTo("/")
    }
})