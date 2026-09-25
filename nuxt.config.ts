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
  /**
   * 部署元信息通过 public runtimeConfig 暴露给客户端。
   * runtimeConfig 在【构建期 Node 上下文】读取 process.env，并把值序列化进客户端产物，
   * 因此这是把 CI 注入的 commit 等环境变量安全带到浏览器控制台的唯一可靠方式。
   * （app.config.ts 在客户端运行时执行，process.env 为 undefined，不可用于此目的。）
   */
  runtimeConfig: {
    public: {
      buildCommit: (process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? '').slice(0, 7),
      buildTime: new Date().toISOString(),
      vercelProjectUrl: process.env.VERCEL_DEPLOY_URL ?? '',
    },
  },
});
