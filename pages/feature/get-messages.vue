<script lang="ts" setup>
import {
  Button,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  Message,
  Radio,
  RadioGroup,
  Spin,
  Tag,
  TypographyTitle,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

import {
  getBotUserId,
  getMessage,
  getUpdates,
  toDisplay,
} from '~/utils/feature/message';

definePageMeta({
  title: '获取消息',
  requiredAuth: true,
});

const router = useRouter();

type Status = 'default' | 'loading';
const status = ref('default' as Status);

/** 模式：批量 Update / 单条详情。 */
const mode = ref('updates' as 'updates' | 'detail');
/** 批量获取是否使用不阻塞的简易版。 */
const simple = ref(true);
const form = reactive({
  msgType: '',
  limit: 100,
  timeout: 5,
  offset: 0,
  chatId: '',
  messageId: '',
});

const REQUIRE_RULE: FieldRule = { required: true, message: '本项必填' };

/** 结果条目（保留原始对象，展示时容错提取）。 */
interface ResultRow {
  key: string;
  messageId: string;
  channelId: string;
  userId: string;
  text: string;
  raw: string;
}
const rows = ref([] as ResultRow[]);
/** 最后一次请求的原始响应文本，便于排查。 */
const rawResponse = ref('');

/** 把任意值安全序列化为带缩进的字符串（BigInt 转字符串）。 */
function stringify(value: unknown): string {
  try {
    return JSON.stringify(
      value,
      (_k, v) => (typeof v === 'bigint' ? String(v) : v),
      2,
    ) ?? '';
  } catch {
    return String(value);
  }
}

/** 从任意形态的 Update / Message 对象中容错提取关键字段。 */
function extract(source: any, index: number): ResultRow {
  // Fanbook 兼容 Telegram：Update 可能是 { message: {...} }，也可能直接是 Message
  const obj = source?.message ?? source?.data ?? source ?? {};
  const chat = obj.chat ?? obj.channel ?? {};
  const from = obj.from ?? obj.author ?? {};
  const content = obj.text ?? obj.content ?? obj.desc ?? obj.description ?? '';
  let text = typeof content === 'string' ? content : stringify(content);
  // 富文本 / 卡片消息的 text 是 JSON 字符串，尝试提取可读文字
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      text = parsed.text ?? parsed.title ?? parsed.document ?? text;
    } catch { /* 保持原文 */ }
  }
  return {
    key: `${index}-${toDisplay(obj.message_id ?? obj.id ?? index)}`,
    messageId: toDisplay(obj.message_id ?? obj.id ?? obj.msg_id ?? ''),
    channelId: toDisplay(
      chat.id ?? obj.channel_id ?? obj.chat_id ?? obj.guild_id ?? '',
    ),
    userId: toDisplay(from.id ?? obj.user_id ?? obj.author_id ?? ''),
    text,
    raw: stringify(source),
  };
}

/** 把接口返回的 result 统一转成数组。 */
function toArray(result: unknown): any[] {
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object') {
    const r = result as any;
    for (const key of ['updates', 'messages', 'list', 'data', 'result']) {
      if (Array.isArray(r[key])) return r[key];
    }
    return [result];
  }
  return [];
}

async function onSubmit() {
  status.value = 'loading';
  rows.value = [];
  rawResponse.value = '';
  try {
    const res = mode.value === 'updates'
      ? await getUpdates({
        simple: simple.value,
        msgType: form.msgType || undefined,
        limit: simple.value ? undefined : Number(form.limit) || 100,
        timeout: simple.value ? undefined : Number(form.timeout) || 5,
        offset: simple.value ? undefined : Number(form.offset) || 0,
      })
      : await getMessage(form.chatId.trim(), form.messageId.trim());

    rawResponse.value = stringify(res);
    if (res.ok === false || res.description) {
      Message.error({
        content: `接口返回错误：${toDisplay(res.description)}${res.error_code ? `（${res.error_code}）` : ''}`,
        duration: 6000,
      });
      status.value = 'default';
      return;
    }
    rows.value = toArray(res.result).map(extract);
    if (!rows.value.length) {
      Message.info({
        content: '暂无消息。机器人默认只能收到公开频道的新成员消息与 @ 机器人的消息，需在机器人设置里开启全量开关并加白名单',
        duration: 8000,
      });
    } else {
      Message.success(`获取到 ${rows.value.length} 条消息`);
    }
  } catch (e: any) {
    console.error(e);
    Message.error({
      content: '获取失败：' + (e?.message ?? String(e)),
      duration: 6000,
    });
  }
  status.value = 'default';
}

/** 把消息 ID / 频道 ID 带去表态页；user_id 优先用机器人自身 ID。 */
async function goReact(row: ResultRow) {
  let botId = '';
  try {
    botId = await getBotUserId();
  } catch {
    // 获取失败时回退到消息作者 ID，用户仍可在表态页手动修改
  }
  router.push({
    path: '/feature/react-message',
    query: {
      messageId: row.messageId,
      channelId: row.channelId,
      userId: botId || row.userId,
    },
  });
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    Message.success('已复制');
  } catch {
    Message.warning('复制失败，请手动选择复制');
  }
}
</script>

<template>
  <Spin class='form-wrapper' :loading='status === "loading"' tip='正在获取消息'>
    <Form
      class='form'
      :model='form'
      :disabled='status === "loading"'
      auto-label-width
      @submit-success='onSubmit'
    >
      <TypographyTitle :heading='4'>获取方式</TypographyTitle>
      <FormItem label='模式'>
        <RadioGroup v-model='mode' type='button'>
          <Radio value='updates'>批量拉取消息</Radio>
          <Radio value='detail'>查询单条详情</Radio>
        </RadioGroup>
      </FormItem>

      <template v-if='mode === "updates"'>
        <FormItem label='接口版本' tooltip='简易版不阻塞且支持多实例；长轮询版在有新消息时才返回'>
          <RadioGroup v-model='simple' type='button'>
            <Radio :value='true'>简易版 v2/getUpdates</Radio>
            <Radio :value='false'>长轮询 getUpdates</Radio>
          </RadioGroup>
        </FormItem>
        <FormItem label='消息类型' tooltip='可选。circle 代表圈子相关消息，需开启全量开关并加白名单'>
          <Input v-model='form.msgType' placeholder='留空为默认，或填 circle' allow-clear />
        </FormItem>
        <template v-if='!simple'>
          <FormItem label='最大条数'>
            <InputNumber v-model='form.limit' :min='1' :max='100' />
          </FormItem>
          <FormItem label='等待秒数'>
            <InputNumber v-model='form.timeout' :min='0' :max='60' />
          </FormItem>
          <FormItem label='偏移量'>
            <InputNumber v-model='form.offset' :min='0' />
          </FormItem>
        </template>
      </template>

      <template v-else>
        <FormItem label='频道 ID' field='chatId' :rules='REQUIRE_RULE' tooltip='getMessage 仅支持 channel_id'>
          <Input v-model='form.chatId' placeholder='消息所在频道 ID' />
        </FormItem>
        <FormItem label='消息 ID' field='messageId' :rules='REQUIRE_RULE'>
          <Input v-model='form.messageId' placeholder='要查询的消息 ID' />
        </FormItem>
      </template>

      <FormItem class='operations'>
        <Button type='primary' html-type='submit'>获取消息</Button>
      </FormItem>
    </Form>

    <template v-if='rows.length'>
      <TypographyTitle :heading='4'>结果（{{ rows.length }} 条）</TypographyTitle>
      <div v-for='row in rows' :key='row.key' class='msg-card'>
        <div class='msg-fields'>
          <div v-if='row.messageId' class='msg-field'>
            <span class='msg-label'>消息 ID</span>
            <span class='msg-value mono'>{{ row.messageId }}</span>
          </div>
          <div v-if='row.channelId' class='msg-field'>
            <span class='msg-label'>频道 ID</span>
            <span class='msg-value mono'>{{ row.channelId }}</span>
          </div>
          <div v-if='row.userId' class='msg-field'>
            <span class='msg-label'>发送者 ID</span>
            <span class='msg-value mono'>{{ row.userId }}</span>
          </div>
        </div>
        <div v-if='row.text' class='msg-text'>{{ row.text }}</div>
        <div class='msg-actions'>
          <Button
            v-if='row.messageId && row.channelId'
            type='primary'
            size='small'
            @click='goReact(row)'
          >
            对这条表态
          </Button>
          <Button size='small' @click='copyText(row.raw)'>复制原始数据</Button>
          <Tag v-if='!row.messageId' color='gray'>非消息类 Update</Tag>
        </div>
        <details class='msg-raw'>
          <summary>查看原始数据</summary>
          <pre>{{ row.raw }}</pre>
        </details>
      </div>
    </template>
    <Empty
      v-else-if='rawResponse'
      description='接口已返回，但没有可展示的消息'
    />

    <details v-if='rawResponse' class='response-raw'>
      <summary>查看完整接口响应</summary>
      <pre>{{ rawResponse }}</pre>
    </details>

    <div class='hint'>
      提示：调用 getUpdates 会消费队列（长轮询版的 offset 之前的数据会被删除），
      请在测试环境谨慎使用；简易版不会阻塞，适合本工具。
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
.msg-card {
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-2);
}
.msg-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-bottom: 8px;
}
.msg-field {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
}
.msg-label {
  flex: none;
  font-size: 12px;
  color: var(--color-text-3);
}
.msg-value {
  font-size: 12px;
  word-break: break-all;
}
.mono {
  font-family: var(--winui-font, ui-monospace, monospace);
}
.msg-text {
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--color-fill-1);
}
.msg-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.msg-raw,
.response-raw {
  margin-top: 10px;
  font-size: 12px;
  color: var(--color-text-3);
}
.msg-raw summary,
.response-raw summary {
  cursor: pointer;
  user-select: none;
}
pre {
  max-height: 320px;
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
