<script lang="ts" setup>
import { TypographyText } from '@arco-design/web-vue';

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
}, {
  label: '由云痕科技修改',
  link: 'https://github.com/yhkj-nb/fanbook-bot-tools-V2',
}, {
  label: '关于',
  link: '/about',
}, {
  label: '版本信息',
  link: '/version',
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
    <TypographyText class='footer-copy'>
      Released under
      <AppLink
        to='https://opensource.org/license/mit/'
        :hoverable='false'
      >
        MIT License
      </AppLink>
      ，Copyright &copy; 2026云痕科技
    </TypographyText>
    <TypographyText class='footer-copy footer-copy--brand'>
      本版本由云痕科技（yhkj-nb）二次开发维护
    </TypographyText>
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
.footer-copy {
  font-size: 12px;
  color: var(--color-text-3);
  text-align: center;
  line-height: 1.6;
  padding: 0 12px;
  word-break: break-word;
}
.footer-copy--brand {
  color: var(--winui-accent, #0078d4);
  font-weight: 600;
}
/* 手机端：页脚文字与间距略收紧，避免换行后过于松散 */
@media (max-width: 768px) {
  .footer {
    gap: 4px;
    padding: 10px 12px 16px;
  }
  .footer-links {
    gap: 4px 8px;
    font-size: 13px;
  }
  .footer-copy {
    font-size: 11px;
    line-height: 1.5;
  }
}
</style>
