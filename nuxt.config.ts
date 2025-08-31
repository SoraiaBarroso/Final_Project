// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxtjs/supabase'],
  plugins: [],
  css: ['~/assets/css/main.css'],
  ui: {
    colorMode: false
  },
  supabase: {
    redirectOptions: {
      login: '/', // User will be redirected to this path if not authenticated or after logout.
      callback: '/auth/confirm', // This is the path the user will be redirect to after supabase login redirection.
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
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Keys within public are also exposed client-side
    public: {
      googleClientId: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_ID,
      googleClientSecret: process.env.NUXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    }
  },
  app: {
    head: {
      link: [
        { rel: 'preload', as: 'image', href: '/favicon.png' }
      ]
    }
  }
})

// const runtimeConfig = useRuntimeConfig()