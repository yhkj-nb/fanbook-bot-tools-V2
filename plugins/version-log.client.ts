/**
 * 在浏览器控制台输出当前部署版本信息。
 *
 * 页面上与浏览器标题栏都不再显示版本号，构建 / 部署状态统一走控制台：
 * 打开开发者工具（F12，手机端可用 vConsole 之类的面板）即可看到当前部署的
 * commit 短哈希、构建时间，以及 GitHub main 最新提交的对比结果。
 */
export default defineNuxtPlugin(async () => {
  /** 构建时注入的部署元信息（通过 public runtimeConfig 暴露给客户端）。 */
  const deploy = useRuntimeConfig().public as {
    buildCommit?: string;
    buildTime?: string;
    vercelProjectUrl?: string;
  };

  const commit = deploy.buildCommit || 'unknown';
  const buildTime = deploy.buildTime || 'unknown';

  console.info(
    `%cFanbook 机器人工具%c GitHub · ${commit} `,
    'background:#0078D4;color:#fff;border-radius:4px 0 0 4px;padding:3px 8px;font-weight:600;',
    'background:#eaf4fd;color:#005a9e;border-radius:0 4px 4px 0;padding:3px 8px;font-weight:600;font-family:ui-monospace,SFMono-Regular,monospace;',
  );
  console.info(`构建时间：${buildTime}`);
  if (deploy.vercelProjectUrl) {
    console.info(`部署地址：${deploy.vercelProjectUrl}`);
  }

  // 与 GitHub main 最新提交比对，判断是否有新提交尚未部署。
  try {
    const status = await checkUpdate();
    if (status.hasUpdate) {
      console.warn(`GitHub 已有新提交 ${status.latest} 尚未部署（当前部署：${commit}）`);
    } else if (status.latest) {
      console.info(`已是最新版本（${commit}）`);
    }
  } catch {
    // 更新检查失败静默忽略，不影响正常使用
  }
});
