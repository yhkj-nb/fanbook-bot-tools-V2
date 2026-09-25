<script lang="ts" setup>
import {
  LayoutContent,
  LayoutFooter,
  LayoutHeader,
} from '@arco-design/web-vue';
import '@arco-design/web-vue/dist/arco.css';

import { checkAuth } from './middleware/guard.global';
checkAuth(useRoute());

/** 浏览器标签页标题（版本号只在控制台输出，不再显示在页面/标题上）。 */
const titleText = 'Fanbook 机器人工具';
</script>

<template>
  <Teleport to='head'>
    <title>{{ titleText }}</title>
  </Teleport>
  <LayoutHeader>
    <NuxtLayout name='header' />
  </LayoutHeader>
  <LayoutContent>
    <NuxtPage />
  </LayoutContent>
  <LayoutFooter>
    <NuxtLayout name='footer' />
  </LayoutFooter>
</template>

<style>
* {
  margin: 0;
  padding: 0;
}
*::-webkit-scrollbar {
  display: none;
}

/* 防止任何子元素（如 100vw 的页脚）导致的横向滚动 */
html,
body {
  overflow-x: hidden;
  max-width: 100%;
}

#__nuxt {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}
header, footer {
  user-select: none;
}
footer {
  display: flex;
  width: 100%;
  max-width: 100%;
  margin-bottom: 8px !important;
  align-self: baseline;
  flex-direction: column;
  justify-content: center;
}

.arco-typography b {
  font-weight: bold;
}
body.mobile .arco-modal.arco-modal-simple {
  max-width: 75vw;
}
body.mobile .arco-modal:not(.arco-modal-simple) {
  max-width: 90vw;
}
</style>
