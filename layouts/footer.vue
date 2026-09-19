<script lang="ts" setup>
import {
  Divider,
  TypographyText,
} from '@arco-design/web-vue';

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
/** 仓库 / 项目相关链接（用连接符归在一起）。 */
const repositoryLinks: FooterItem[] = [{
  label: '原仓库',
  link: 'https://github.com/Starlight-Dev-Team/fanbook-bot-tools',
}, {
  label: '由 yhkj-nb 修改',
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
  <div class='footer-links'>
    <TypographyText>
      <TypographyText v-for='(item, index) in communityLinks'>
        <Divider v-if='!!index' direction='vertical' />
        <AppLink :to='item.link'>
          {{ item.label }}
        </AppLink>
      </TypographyText>
    </TypographyText>
    <Divider direction='horizontal' />
    <TypographyText>
      <TypographyText v-for='(item, index) in repositoryLinks'>
        <Divider v-if='!!index' direction='vertical' />
        <AppLink :to='item.link'>
          {{ item.label }}
        </AppLink>
      </TypographyText>
    </TypographyText>
  </div>
  <TypographyText>
    Released under
    <AppLink to='https://opensource.org/license/mit/' :hoverable='false'>
      MIT License
    </AppLink>
    <ClientOnly>
      <template v-if='$device === "desktop"'>,</template>
      <template v-else><br /></template>
    </ClientOnly>
    Copyright &copy; 2023 星光工作室
  </TypographyText>
</template>

<style scoped>
span.arco-typography:deep() {
  text-align: center;
}
.footer-links {
  margin-bottom: 8px;
}
</style>
