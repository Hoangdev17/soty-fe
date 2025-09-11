// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2025-09-09",
  modules: ["@nuxt/ui", "@pinia/nuxt"],
  css: ["~/css/main.css"],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL,
    },
  },
});
