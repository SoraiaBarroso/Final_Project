import { defineNuxtRouteMiddleware, navigateTo } from 'nuxt/app'

export default defineNuxtRouteMiddleware(async () => {
    const { role, getUser } = useAuth()

    // Ensure we have the latest user data and role
    await getUser()

    console.log('Student-only middleware - current role:', role.value)

    // If the user is an admin, send them to the admin dashboard
    if (role.value === 'admin') {
        console.log('Redirecting admin user to admin dashboard')
        return navigateTo('/admin/dashboard')
    }
})
