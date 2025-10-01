import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app"

export default defineNuxtRouteMiddleware(async () => {
    const { role, getUser } = useAuth()

    // Ensure we have the latest user data and role
    await getUser()

    console.log("Admin middleware - current role:", role.value)

    if (role.value !== "admin") {
        console.log("Access denied: Admin role required")
        return navigateTo("/students/dashboard") // Redirect non-admins to student dashboard
    }
})