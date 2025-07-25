// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxtjs/supabase'],
  css: ['~/assets/css/main.css'],
  supabase: {
    redirectOptions: {
      login: '/', // User will be redirected to this path if not authenticated or after logout.
      callback: '/confirm', // This is the path the user will be redirect to after supabase login redirection.
      include: undefined, // Routes to include in the redirect. ['/admin(/*)?'] will enable the redirect only for the admin page and all sub-pages.
      exclude: ['/'],
      cookieRedirect: false,
    },
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  runtimeConfig: {
    // Credentials - server-side only for security
    scraperUsername: process.env.SCRAPER_USERNAME,
    scraperPassword: process.env.SCRAPER_PASSWORD,
    // Keys within public are also exposed client-side
    // public: {
    //   apiBase: '/api'
    // }
  },
})

// const runtimeConfig = useRuntimeConfig()