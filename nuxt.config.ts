// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devServer: {
    host: "localhost", // Accessible depuis l'extérieur du conteneur
    port: 3000,
  },
  app: {
    head: {
      title: "SMI Corporation",
      htmlAttrs: {
        lang: "fr",
        class: "${color}-mode",
      },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "le site de SMI Corporation" },
        { name: "author", content: "Hanaro Darcombe" },
        {
          name: "keywords",
          content: "SMI, Corporation, entreprise, société, services",
        },
        { name: "robots", content: "index, follow" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon/favicon.ico" },
        { rel: "apple-touch-icon", href: "/favicon/apple-touch-icon.png" },
        { rel: "manifest", href: "/favicon/site.webmanifest" },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon/favicon-16x16.png",
        },
      ],
    },
  },

  compatibilityDate: "2025-04-09",
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },

  css: [
    "~/assets/css/main.css",
    "@fortawesome/fontawesome-free/css/all.min.css",
  ],

  colorMode: {
    preference: "system", // default value of $colorMode.preference
    fallback: "light", // fallback value if not system preference found
    hid: "nuxt-color-mode-script",
    globalName: "__NUXT_COLOR_MODE__",
    componentName: "ColorScheme",
    classPrefix: "",
    classSuffix: "-mode",
    storage: "localStorage", // or 'sessionStorage' or 'cookie'
    storageKey: "nuxt-color-mode",
  },

  modules: [
    "@nuxt/content",
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxt/icon",
    // "@nuxt/image", // Désactivé pour hébergement local complet
    "@nuxt/ui",
    "@pinia/nuxt",
    "nuxt-auth-utils",
    "nuxt-csurf",
  ],

  // Configuration Nuxt UI avec Tailwind Typography
  ui: {
    global: true,
    icons: ['heroicons', 'lucide']
  },

  // Performance optimizations
  experimental: {
    payloadExtraction: false,
    typedPages: true,
  },

  // Build optimizations
  build: {
    transpile:
      process.env.NODE_ENV === "production" ? ["vue-toastification"] : [],
  },

  // CSRF protection configuration - Enhanced security
  csurf: {
    enabled: true, // ✅ CSRF protection enabled
    cookieKey: "XSRF-TOKEN",
    cookieHttpOnly: false, // Allow JS access for SPA compatibility
    cookieSameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    cookieSecure: process.env.NODE_ENV === "production",
    methods: ["POST", "PUT", "DELETE", "PATCH"],
    excludedUrls: [
      ["/api/_auth/session", "GET"],
      ["/api/csrf-token", "GET"],
      // Temporairement exclure auth endpoints pour faciliter les tests
      ["/api/auth/login", "POST"],
      ["/api/auth/register", "POST"],
    ],
    https: process.env.NODE_ENV === "production",
    methodsToProtect: ["POST", "PUT", "DELETE", "PATCH"],
    addCsrfTokenToEventCtx: true,
    secret: process.env.CSRF_SECRET || (() => {
      if (process.env.NODE_ENV === "production") {
        throw new Error("CSRF_SECRET environment variable is required in production");
      }
      console.warn("⚠️  Using default CSRF secret for development only");
      return "dev-csrf-secret-change-in-production-" + Math.random().toString(36).substring(2, 15);
    })(),
  },

  runtimeConfig: {
    public: {
      apiBase: "/api",
      appName: "SMI Corporation",
      appVersion: process.env.npm_package_version || "1.0.0",
    },
    // Server-only keys
    jwtSecret: process.env.JWT_SECRET,
    useMockDb: process.env.USE_MOCK_DB === "true",
  },
  // Enhanced error handling and performance
  hooks: {
    "vue:errorCaptured": (error, instance, info) => {
      console.error("[Vue Error]", {
        error: error.message,
        component: instance?.$options.name || "Unknown",
        info,
        stack: error.stack,
      });
    },
    "build:error": (error) => {
      console.error("[Build Error]", error);
    },
  },
  nitro: {
    experimental: {
      wasm: true,
    },
    esbuild: {
      target: 'es2022'
    },
    hooks: {
      error: (error, event) => {
        console.error("[API Error]", {
          url: event?.node?.req?.url,
          method: event?.node?.req?.method,
          error: error.message,
          stack: error.stack,
        });
      },
    },
    compressPublicAssets: true,
  },
});
