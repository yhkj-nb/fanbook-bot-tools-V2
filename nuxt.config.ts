export default defineNuxtConfig({
  ssr: false,
  css: [
    '~/assets/css/winui.css',
  ],
  modules: [
    [
      '@pinia/nuxt',
      {
        autoImports: [
          'defineStore',
        ],
      },
    ],
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
  ],
});
