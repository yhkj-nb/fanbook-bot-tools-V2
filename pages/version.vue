<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button,
  Form,
  FormItem,
  Spin,
  Tag,
} from '@arco-design/web-vue';
import {
  IconCheckCircleFill,
  IconExclamationCircleFill,
  IconQuestionCircleFill,
  IconRefresh,
} from '@arco-design/web-vue/es/icon';

import {
  checkUpdate,
  getLatestVersion,
  GITHUB_FORK_REPOSITORY_URL,
  type UpdateStatus,
  type VersionInfo,
} from '~~/utils/app';

/** 构建时注入的部署元信息（通过 public runtimeConfig 暴露给客户端）。 */
const deploy = useRuntimeConfig().public as {
  buildCommit?: string;
  buildTime?: string;
  vercelProjectUrl?: string;
};
/** 当前部署版本（构建时注入）。 */
const currentCommit = deploy.buildCommit || 'unknown';
/** 当前部署版本提交时间。 */
const buildTime = deploy.buildTime
  ? new Date(deploy.buildTime).toLocaleString('zh-CN')
  : '未知';
/** Vercel 部署页地址（为空则不显示「查看部署」）。 */
const vercelProjectUrl = deploy.vercelProjectUrl || '';

/** GitHub 最新提交信息。 */
const latest = ref(undefined as VersionInfo | undefined);
/** 更新检查状态。 */
const update = ref(undefined as UpdateStatus | undefined);
/** 是否正在加载 / 检查。 */
const loading = ref(true);
const checking = ref(false);

/** 加载 GitHub 最新提交信息。 */
async function loadLatest() {
  loading.value = true;
  try {
    latest.value = await getLatestVersion();
  } catch {
    latest.value = undefined;
  } finally {
    loading.value = false;
  }
}

/** 检查当前部署版本与 GitHub 最新提交是否有差异（即是否有更新未部署）。 */
async function onCheck() {
  checking.value = true;
  try {
    update.value = await checkUpdate();
  } catch {
    update.value = undefined;
  } finally {
    checking.value = false;
  }
}

onMounted(async () => {
  await loadLatest();
  await onCheck();
});
</script>

<template>
  <Spin class='form-wrapper' :loading='loading && !latest' tip='正在加载'>
    <Form
      class='form'
      :model='{}'
      :disabled='true'
      auto-label-width
    >
      <FormItem label='当前部署版本'>
        <span class='mono'>{{ currentCommit }}</span>
        <Tag
          v-if='update'
          class='tag'
          :color='update.hasUpdate ? "orange" : "green"'
        >
          <template #icon>
            <IconExclamationCircleFill v-if='update.hasUpdate' />
            <IconCheckCircleFill v-else />
          </template>
          {{ update.hasUpdate ? '有更新未部署' : '已是最新' }}
        </Tag>
        <Tag v-else-if='!loading' class='tag' color='gray'>
          <template #icon>
            <IconQuestionCircleFill />
          </template>
          未检查
        </Tag>
      </FormItem>
      <FormItem label='部署提交时间'>
        {{ buildTime }}
      </FormItem>
      <FormItem label='GitHub 最新提交'>
        <template v-if='latest'>
          <span class='mono'>{{ latest.id }}</span>
          <Tag
            class='tag'
            :color='latest.verified ? "green" : "red"'
          >
            <template #icon>
              <IconCheckCircleFill v-if='latest.verified' />
              <IconQuestionCircleFill v-else />
            </template>
            {{ latest.verified ? '已验证' : '未验证' }}
          </Tag>
        </template>
        <span v-else class='muted'>加载失败</span>
      </FormItem>
      <FormItem label='最新提交时间'>
        <span v-if='latest'>{{ latest.time.toLocaleString('zh-CN') }}</span>
        <span v-else class='muted'>—</span>
      </FormItem>
      <FormItem label='贡献者'>
        <span v-if='latest'>{{ latest.author }}</span>
        <span v-else class='muted'>—</span>
      </FormItem>
      <FormItem label='更新说明'>
        <span v-if='latest'>{{ latest.message.split('\n')[0] }}</span>
        <span v-else class='muted'>—</span>
      </FormItem>
    </Form>

    <div class='actions'>
      <Button
        type='primary'
        :loading='checking'
        @click='onCheck'
      >
        <template #icon>
          <IconRefresh />
        </template>
        检查更新
      </Button>
      <Button @click='loadLatest'>
        刷新 GitHub 提交
      </Button>
      <AppLink
        :to='`${GITHUB_FORK_REPOSITORY_URL}/commit/${currentCommit}`'
        class='btn-link'
      >
        在 GitHub 查看当前版本
      </AppLink>
      <AppLink
        v-if='vercelProjectUrl'
        :to='vercelProjectUrl'
        class='btn-link'
      >
        查看部署
      </AppLink>
    </div>
  </Spin>
</template>

<style scoped>
.form-wrapper {
  display: block;
  width: 70%;
  height: 100%;
  margin: 0 auto;
}
body.mobile .form-wrapper {
  width: 90%;
}
.form-wrapper:deep() .arco-spin-mask {
  position: initial;
}
.form {
  margin-top: 12px;
  width: 100%;
}
.tag {
  margin-left: 8px;
  user-select: none;
}
.mono {
  font-family: var(--winui-font, ui-monospace, SFMono-Regular, monospace);
  letter-spacing: .3px;
}
.muted {
  color: var(--color-text-3);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}
.btn-link {
  font-size: 13px;
}
</style>
