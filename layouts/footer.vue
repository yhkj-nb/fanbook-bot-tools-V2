<script lang="ts" setup>
export interface FooterItem {
  label: string;
  link: string;
}
/** 社区相关链接。 */
const communityLinks: FooterItem[] = [{
  label: 'Fanbook 开放平台',
  link: 'https://open.fanbook.mobi/',
}, {
  label: 'QQ 群',
  link: 'https://yhkj-nb.github.io/QQ.html',
}];
/** 仓库 / 项目相关链接（用连接符串在一起）。 */
const repositoryLinks: FooterItem[] = [{
  label: '原仓库',
  link: 'https://github.com/Starlight-Dev-Team/fanbook-bot-tools',
}];
</script>

<template>
  <div class='footer'>
    <div class='footer-links'>
      <template
        v-for='(item, index) in communityLinks'
        :key='item.link'
      >
        <span
          v-if='index'
          class='footer-sep'
        >·</span>
        <AppLink
          :to='item.link'
          class='footer-link'
        >
          {{ item.label }}
        </AppLink>
      </template>
      <span class='footer-sep footer-sep--group'>|</span>
      <template
        v-for='(item, index) in repositoryLinks'
        :key='item.link'
      >
        <span
          v-if='index'
          class='footer-sep'
        >|</span>
        <AppLink
          :to='item.link'
          class='footer-link'
        >
          {{ item.label }}
        </AppLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
}
.footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px 10px;
}
.footer-link {
  white-space: nowrap;
}
.footer-sep {
  color: var(--color-text-3);
  user-select: none;
}
.footer-sep--group {
  color: var(--color-text-2);
  margin: 0 2px;
}
</style>
