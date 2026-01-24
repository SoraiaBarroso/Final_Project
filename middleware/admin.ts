import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app"

export default defineNuxtRouteMiddleware(async () => {
    const { role, getUser } = useAuth()

    // Ensure we have the latest user data and role
    await getUser()

    if (role.value !== "admin") {
        return navigateTo("/students/dashboard") // Redirect non-admins to student dashboard
    }
})
