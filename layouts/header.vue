<script lang="ts" setup>
import { computed, onBeforeMount, onMounted, ref } from 'vue';

import {
  Button,
  Doption,
  Dropdown,
  Dsubmenu,
  Message,
  PageHeader,
  Space,
  Tag,
  Tooltip,
} from '@arco-design/web-vue';

import { back } from '~~/utils/router';

import { useAccountStore } from '~~/stores/account';

import { Bot } from '@starlight-dev-team/fanbook-api-sdk';
import type { Profile } from '@starlight-dev-team/fanbook-api-sdk/dist/types';

import { checkUpdate } from '~~/utils/app';

import { switchBot } from '~~/utils/account';

const defaultTitle = 'Fanbook 机器人工具';
/** 构建时注入的部署元信息（沙箱无 .nuxt 类型声明时做形状断言）。 */
const appConfig = useAppConfig() as {
  announcements: unknown[];
  buildCommit: string;
};
const hasAnnouncements = !!appConfig.announcements?.length;

/** 当前部署版本（构建时注入的 commit 短哈希）。 */
const currentCommit = appConfig.buildCommit || 'unknown';

/** GitHub main 最新提交短哈希。 */
const latestCommit = ref('');
/** 是否存在未部署的更新。 */
const hasUpdate = ref(false);
/** 是否正在检查。 */
const checking = ref(false);

/** 悬停提示文案。 */
const tip = computed(() =>
  hasUpdate.value
    ? 'GitHub 已有新提交未部署，点此查看'
    : '已是最新版本，点此查看版本详情',
);

/** 进入版本信息页（含更新 / 部署对比）。 */
function openVersion() {
  navigateTo('/version');
}

/** 挂载后对比当前部署版本与 GitHub 最新提交，判断是否有更新未部署。 */
onMounted(async () => {
  checking.value = true;
  try {
    const status = await checkUpdate();
    latestCommit.value = status.latest;
    hasUpdate.value = status.hasUpdate;
  } catch {
    // 检查失败静默忽略，Tab 仍显示当前部署版本
  } finally {
    checking.value = false;
  }
});

let botsProfile: Record<string, Profile> = {};

let activeProfile = ref(undefined as Profile | undefined);

function switchToBot(token: string) {
  Message.loading({
    content: '正在切换机器人',
    duration: NaN,
  });
  switchBot(token);
  location.reload();
}

const loading = ref(true);

onBeforeMount(async () => {
  const store = useAccountStore();
  botsProfile = store.botProfiles;
  activeProfile.value = botsProfile[store.activeBotToken ?? ''];
  loading.value = false;
});
</script>

<template>
  <PageHeader
    :title='$route.meta.title as string ?? defaultTitle'
    :show-back='$route.path !== "/"'
    @back='back'
  >
    <template #extra>
      <ClientOnly>
        <Tooltip :content='tip'>
          <Tag
            class='version-tab'
            :color='hasUpdate ? "orange" : "green"'
            :loading='checking'
            @click='openVersion'
          >
            GitHub · {{ currentCommit }}
          </Tag>
        </Tooltip>
        <Dropdown
          v-if='activeProfile || loading'
          trigger='hover'
          position='br'
        >
          <BotInfo class='bot-avatar' :profile='activeProfile' />
          <template #content>
            <Dsubmenu trigger='hover'>
              <template #default>切换机器人</template>
              <template #content>
                <Doption
                  v-for='(profile, token) in botsProfile'
                  class='bot-list'
                  @click='() => switchToBot(token)'
                >
                  <BotInfo :profile='profile' />
                </Doption>
              </template>
            </Dsubmenu>
            <Doption @click='() => $router.push("/login")'>
              添加机器人
            </Doption>
          </template>
        </Dropdown>
        <Space v-else>
          <Button type='primary' @click='() => $router.push("/login")'>
            登录
          </Button>
        </Space>
      </ClientOnly>
    </template>
  </PageHeader>
  <div :class='hasAnnouncements ? "announcement" : undefined'>
    <Announcement />
  </div>
</template>

<style scoped>
:deep() .arco-page-header-extra {
  overflow: visible;
  height: 30px;
}
:deep() .bot-avatar {
  margin-top: -5px;
}
.bot-list {
  line-height: unset;
}
/* 版本 Tab：常驻显示 GitHub 提交版本号，一眼看出有无新提交 / 部署 */
.version-tab {
  margin-right: 10px;
  cursor: pointer;
  user-select: none;
  font-family: var(--winui-font, ui-monospace, SFMono-Regular, monospace);
  letter-spacing: .3px;
}
body.mobile .bot-avatar:deep() .bot-avatar,
body.mobile .bot-avatar:deep() .bot-avatar-loading {
  visibility: hidden;
  width: 0;
  height: 100%;
}

.announcement {
  margin-bottom: 12px;
}
</style>
