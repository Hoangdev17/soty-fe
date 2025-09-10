// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: "2025-09-09",
  modules: ["@nuxt/ui", "@pinia/nuxt"],
  css: ["~/css/main.css"],
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || "http://localhost:3000",
    },
  },
});
