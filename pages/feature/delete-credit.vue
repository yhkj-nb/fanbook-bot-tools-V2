<script lang="ts" setup>
import { Bot } from '@starlight-dev-team/fanbook-api-sdk';
import type {
  GuildCredit,
} from '@starlight-dev-team/fanbook-api-sdk/dist/types';

import { useAccountStore } from '~~/stores/account';

import {
  Button,
  Form,
  FormItem,
  Image,
  Message,
  Spin,
  Select,
  Option,
  TypographyTitle,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

definePageMeta({
  title: '删除荣誉卡槽',
  requiredAuth: true,
});

interface Input {
  guild?: bigint;
  user?: bigint;
  card: string;
}
const input = reactive({
  card: '',
} as Input);

const REQUEIRE_RULE: FieldRule = {
  required: true,
  message: '本项必填',
};

type Status = 'default' | 'loading' | 'fetching';
const status = ref('default' as Status);

const bot = new Bot(useAccountStore().activeBotToken as string);

/** 该用户的全部徽章，用于下拉选择。 */
const credits = ref([] as GuildCredit[]);

/** 当前在下拉中选中的徽章（用于预览）。 */
const selectedCredit = computed(() => credits.value.find(c => c.id === input.card));

/** 拉取用户全部徽章，填充下拉选项。 */
async function fetchCredits() {
  if (!input.guild || !input.user) {
    Message.warning({
      content: '请先填写服务器与用户',
      duration: 2500,
    });
    return;
  }
  status.value = 'fetching';
  try {
    const res = await bot.getGuildUserCredit({
      guild: input.guild as bigint,
      user: input.user as bigint,
    });
    credits.value = res;
    if (res.length === 0) {
      Message.info({
        content: '该用户暂无任何勋章',
        duration: 3000,
      });
    }
  } catch (err: any) {
    console.error(err);
    Message.error({
      content: '获取勋章失败：' + (err.response?.data?.description ?? '未知错误'),
      duration: 6000,
    });
  }
  status.value = 'default';
}

// 服务器 ID 与用户 ID（短 ID 解析后的完整 ID）都就绪后自动拉取
watch(
  () => [input.guild, input.user],
  ([g, u]) => {
    if (g && u) fetchCredits();
  },
);

async function onSubmit() {
  status.value = 'loading';
  try {
    await bot.deleteGuildUserCredit({
      guild: input.guild as bigint,
      user: input.user as bigint,
      card: input.card,
    });
    Message.success({
      content: '删除成功',
      duration: 2500,
    });
    input.card = '';
    // 重新拉取，刷新下拉列表
    await fetchCredits();
  } catch (err: any) {
    console.error(err);
    Message.error({
      content: '删除失败：' + (err.response?.data?.description ?? '未知错误'),
      duration: 6000,
    });
  }
  status.value = 'default';
}
</script>

<template>
  <Spin
    class='form-wrapper'
    :loading='status === "loading"'
    tip='正在执行'
  >
    <Form
      class='form'
      :model='input'
      :disabled='status === "loading"'
      auto-label-width
      @submit-success='onSubmit'
    >
      <GuildInputForm
        v-model='input.guild'
        field='guild'
        required
      />
      <UserInputForm
        v-model='input.user'
        :guild='input.guild'
        field='user'
        required
      />

      <FormItem
        label='自定义 ID'
        field='card'
        tooltip='点击下拉选择要删除的勋章（已自动拉取该用户全部徽章）'
        :rules='[REQUEIRE_RULE, { minLength: 10, message: "至少10字符" }]'
      >
        <Select
          v-model='input.card'
          placeholder='请选择要删除的勋章'
          allow-search
          :loading='status === "fetching"'
          @focus='() => { if (!credits.length) fetchCredits(); }'
        >
          <Option
            v-for='c in credits'
            :key='c.id'
            :value='c.id'
            :label='c.authority?.name || c.id'
          >
            {{ c.authority?.name || '未命名勋章' }}（{{ c.id }}）
          </Option>
        </Select>
      </FormItem>

      <!-- 徽章预览：选中下拉项后，像「修改勋章」一样实时显示徽章图片与图标 -->
      <template v-if='selectedCredit'>
        <TypographyTitle :heading='4'>徽章预览</TypographyTitle>
        <div class='credit-preview'>
          <div class='preview-card'>
            <div class='preview-header'>
              <Image
                v-if='selectedCredit.authority?.icon'
                class='preview-header-icon'
                :src='selectedCredit.authority.icon'
                :preview='true'
                width='48'
                height='48'
              />
              <div class='preview-header-name'>
                {{ selectedCredit.authority?.name || '这是标题栏' }}
              </div>
            </div>
            <div class='preview-body'>
              <Image
                v-if='selectedCredit.title?.icon'
                class='preview-slot-img'
                :src='selectedCredit.title.icon'
                :preview='true'
                width='120'
                height='120'
              />
              <div
                v-else
                class='preview-slot-value'
              >
                （该勋章无图片）
              </div>
            </div>
            <div class='preview-watermark'>@云痕科技</div>
          </div>
          <div class='preview-nickname'>
            <img
              v-show='selectedCredit.title?.icon'
              class='preview-nick-icon'
              :src='selectedCredit.title.icon'
              alt='勋章图标'
            >
            <span class='preview-nick-text'>用户昵称（勋章显示在昵称左侧）</span>
          </div>
          <div class='preview-id'>勋章 ID：{{ selectedCredit.id }}</div>
        </div>
      </template>

      <FormItem class='operations'>
        <Button
          type='primary'
          html-type='submit'
        >
          删除荣誉卡槽
        </Button>
      </FormItem>
    </Form>
  </Spin>
</template>

<style scoped>
.form-wrapper {
  display: block;
  width: 70%;
  margin: 0 auto;
}
body.mobile .form-wrapper {
  width: 90vw;
}
.form {
  width: 100%;
}
.operations {
  margin-top: 4px;
}
h4 {
  margin-top: 0;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--color-text-4);
  text-align: center;
}
.credit-preview {
  margin-bottom: 16px;
}
.preview-card {
  padding: 16px;
  border: 1px solid var(--color-border-2);
  border-radius: 12px;
  background: var(--color-bg-2);
}
.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.preview-header-icon {
  flex: none;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-fill-2);
}
.preview-header-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}
.preview-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 96px;
  margin-top: 12px;
}
.preview-slot-img {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
  object-fit: contain;
}
.preview-slot-value {
  font-size: 16px;
  color: var(--color-text-1);
}
.preview-nickname {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-left: 4px;
}
.preview-nick-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  object-fit: contain;
}
.preview-nick-text {
  font-size: 14px;
  color: var(--color-text-2);
}
.preview-id {
  margin-top: 8px;
  padding-left: 4px;
  font-size: 12px;
  color: var(--color-text-3);
  word-break: break-all;
}
</style>
