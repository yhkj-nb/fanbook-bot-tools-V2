<script lang="ts" setup>
import {
  Button,
  Form,
  FormItem,
  Input,
  Message,
  Select,
  Option,
  Spin,
  Switch,
  Tag,
  TypographyTitle,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

import {
  REACTION_EMOJIS,
  getBotUserId,
  sendReaction,
  toDisplay,
} from '~/utils/feature/message';

definePageMeta({
  title: '消息表态',
  requiredAuth: true,
});

const REQUIRE_RULE: FieldRule = { required: true, message: '本项必填' };

const form = reactive({
  userId: '',
  messageId: '',
  channelId: '',
  emoji: '赞',
  customEmoji: '',
  avatar: '',
  encodeEmoji: false,
});

const status = ref('default' as 'default' | 'loading' | 'fetching');
/** 最近一次响应文本。 */
const lastResponse = ref('');

onMounted(() => {
  const q = useRoute().query;
  if (q.userId) form.userId = String(q.userId);
  if (q.messageId) form.messageId = String(q.messageId);
  if (q.channelId) form.channelId = String(q.channelId);
});

/** 自动获取当前机器人 ID 填到 user_id。 */
async function fillBotId() {
  status.value = 'fetching';
  try {
    form.userId = await getBotUserId();
    Message.success('已填入当前机器人 ID');
  } catch (e: any) {
    Message.error('获取失败：' + (e?.message ?? String(e)));
  }
  status.value = 'default';
}

/** 常用表情快捷选择。 */
const QUICK_EMOJIS = ['赞', '爱心', '666', '庆祝', '掌声', '好的', '比心', '厉害哦'];

function pickEmoji(name: string) {
  form.emoji = name;
  form.customEmoji = '';
}

async function onSubmit() {
  status.value = 'loading';
  lastResponse.value = '';
  const emoji = (form.customEmoji.trim() || form.emoji || '').trim();
  if (!form.userId.trim() || !form.messageId.trim() || !form.channelId.trim()) {
    Message.warning('请填写用户 ID、消息 ID 与频道 ID');
    status.value = 'default';
    return;
  }
  try {
    const res = await sendReaction({
      userId: form.userId.trim(),
      messageId: form.messageId.trim(),
      channelId: form.channelId.trim(),
      emoji: emoji || undefined,
      avatar: form.avatar.trim() || undefined,
      encodeEmoji: form.encodeEmoji,
    });
    lastResponse.value = JSON.stringify(
      res,
      (_k, v) => (typeof v === 'bigint' ? String(v) : v),
      2,
    );
    if (res.ok === false || res.description || res.error_code) {
      Message.error({
        content: `表态失败：${toDisplay(res.description)}${res.error_code ? `（${res.error_code}）` : ''}`,
        duration: 6000,
      });
    } else {
      Message.success('表态成功');
    }
  } catch (e: any) {
    console.error(e);
    Message.error({
      content: '表态失败：' + (e?.message ?? String(e)),
      duration: 6000,
    });
  }
  status.value = 'default';
}
</script>

<template>
  <Spin class='form-wrapper' :loading='status === "loading"' tip='正在表态'>
    <Form
      class='form'
      :model='form'
      :disabled='status === "loading"'
      auto-label-width
      @submit-success='onSubmit'
    >
      <TypographyTitle :heading='4'>表态目标</TypographyTitle>
      <FormItem
        label='用户 ID'
        field='userId'
        tooltip='表态发起者的用户 ID，通常为机器人自身；可点右侧按钮自动获取'
        :rules='REQUIRE_RULE'
      >
        <Input v-model='form.userId' placeholder='表态用户 ID'>
          <template #append>
            <Button
              type='text'
              :loading='status === "fetching"'
              @click='fillBotId'
            >
              获取机器人 ID
            </Button>
          </template>
        </Input>
      </FormItem>
      <FormItem label='消息 ID' field='messageId' :rules='REQUIRE_RULE'>
        <Input v-model='form.messageId' placeholder='要表态的消息 ID' />
      </FormItem>
      <FormItem label='频道 ID' field='channelId' :rules='REQUIRE_RULE'>
        <Input v-model='form.channelId' placeholder='消息所在频道 ID' />
      </FormItem>

      <TypographyTitle :heading='4'>表情</TypographyTitle>
      <FormItem label='常用表情'>
        <div class='quick-row'>
          <Tag
            v-for='name in QUICK_EMOJIS'
            :key='name'
            class='quick-tag'
            :color='form.emoji === name && !form.customEmoji ? "arcoblue" : undefined'
            checkable
            :checked='form.emoji === name && !form.customEmoji'
            @check='pickEmoji(name)'
          >
            {{ name }}
          </Tag>
        </div>
      </FormItem>
      <FormItem label='官方表情' tooltip='从官方支持的表情名称中选择'>
        <Select v-model='form.emoji' allow-search>
          <Option
            v-for='name in REACTION_EMOJIS'
            :key='name'
            :value='name'
            :label='name'
          >
            {{ name }}
          </Option>
        </Select>
      </FormItem>
      <FormItem label='自定义表情名' tooltip='填写后优先于官方表情生效'>
        <Input v-model='form.customEmoji' placeholder='留空则使用上方选中的官方表情' allow-clear />
      </FormItem>
      <FormItem label='自定义表情图片' tooltip='可选，avatar 参数，填写表情图片地址'>
        <Input v-model='form.avatar' placeholder='https://...' allow-clear />
      </FormItem>
      <FormItem label='URL 编码表情' tooltip='文档注明 emoji 需要 url encode；若默认失败可尝试开启'>
        <Switch v-model='form.encodeEmoji' />
      </FormItem>

      <FormItem class='operations'>
        <Button type='primary' html-type='submit'>发送表态</Button>
      </FormItem>
    </Form>

    <div v-if='lastResponse' class='response'>
      <TypographyTitle :heading='4'>接口响应</TypographyTitle>
      <pre>{{ lastResponse }}</pre>
    </div>

    <div class='hint'>
      提示：表态需要机器人具备对应频道的「消息表态」权限；被设置为「禁止表态」的消息无法表态。
      可先在「获取消息」页拉取消息，再点「对这条表态」自动带入消息 ID 与频道 ID。
    </div>
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
h4 {
  margin-top: 0;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--color-text-4);
  text-align: center;
}
.operations {
  margin-top: 4px;
}
.quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.quick-tag {
  cursor: pointer;
}
.response pre {
  max-height: 300px;
  overflow: auto;
  padding: 10px;
  border-radius: 6px;
  font-size: 11px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--color-fill-1);
}
.hint {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: var(--color-text-3);
  background: var(--color-fill-1);
}
</style>
