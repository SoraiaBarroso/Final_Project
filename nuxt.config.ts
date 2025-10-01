import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: [
    "@nuxt/ui",
    "@nuxt/icon",
    "nuxt-charts",
    "@nuxtjs/supabase",
    "@nuxtjs/color-mode",
    "nuxt-charts",
    "motion-v/nuxt",
    "@vueuse/nuxt",
    "@nuxt/fonts",
  ],
  plugins: [],
  css: ["~/assets/css/main.css"],

  supabase: {
    redirectOptions: {
      login: "/", // User will be redirected to this path if not authenticated or after logout.
      callback: "/auth/confirm", // This is the path the user will be redirect to after supabase login redirection.
      include: undefined, // Routes to include in the redirect. ['/admin(/*)?'] will enable the redirect only for the admin page and all sub-pages.
      exclude: ["/"],
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
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },

  app: {
    head: {
      link: [{ rel: "preload", as: "image", href: "/favicon.png" }],
    },
  },

  imports: {
    imports: [
      {
        from: "tailwind-variants",
        name: "tv",
      },
      {
        from: "tailwind-variants",
        name: "VariantProps",
        type: true,
      },
    ],
  },

  colorMode: {
    storageKey: "Final_Project-color-mode",
    classSuffix: "",
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 0,
    },

    mode: "svg",
    class: "shrink-0",
    fetchTimeout: 2000,
    serverBundle: "local",
  },

  vite: {
    plugins: [tailwindcss()],
  },
});

// const runtimeConfig = useRuntimeConfig()