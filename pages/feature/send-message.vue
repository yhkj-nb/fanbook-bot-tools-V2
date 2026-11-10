<script lang="ts" setup>
import { BotErrorCode, getCurrentBot } from '~/utils/bot';
import { FORM_REQUIRE_RULE } from '~/utils/util';

import type { SelectedChat } from '~/components/chat-selector.vue';

import {
  Badge,
  List,
  ListItem,
  Modal,
  Switch,
  Textarea,
  TypographyParagraph,
  TypographyText,
  FormItem,
} from '@arco-design/web-vue';

definePageMeta({
  title: '发送消息',
  requiredAuth: true,
});

const bot = getCurrentBot();
const loading = ref(false);

interface Input {
  targets: SelectedChat[];
  content: string;
  unreactive: boolean;
  toPrivateChats: boolean;
}
const input: Ref<Input> = ref({
  targets: [],
  content: '',
  unreactive: false,
  toPrivateChats: false,
});

/** 发送一条消息，成功返回消息 ID，失败返回原因文本。 */
async function sendOne(
  chat: bigint,
  content: string,
  unreactive: boolean,
): Promise<bigint | string> {
  try {
    return await bot.sendMessage({
      chat,
      text: content,
      description: content,
      isUnreactive: unreactive,
    });
  } catch (e: any) {
    const data = e?.response?.data;
    const code = data?.error_code;
    const desc = data?.description;
    if (code || desc) return BotErrorCode[code] ?? desc ?? String(e);
    if (e?.code === 'ERR_NETWORK') {
      return '无权限发送消息，或机器人不在发消息 API 白名单中';
    }
    return String(e);
  }
}

/** 批量发送，聚合成功 ID 与各失败原因次数。 */
async function batchSend(
  chats: bigint[],
  content: string,
  unreactive: boolean,
  onBeforeSend?: () => void,
): Promise<{ messages: bigint[]; errors: Map<string, number>; errorCount: number }> {
  const messages: bigint[] = [];
  const errors = new Map<string, number>();
  let errorCount = 0;
  for (const chat of chats) {
    onBeforeSend?.();
    const res = await sendOne(chat, content, unreactive);
    if (typeof res === 'string') {
      errors.set(res, (errors.get(res) ?? 0) + 1);
      errorCount++;
    } else {
      messages.push(res);
    }
  }
  return { messages, errors, errorCount };
}

const total = ref(0);
const current = ref(0);
const errors = reactive(new Map<string, number>());
const messages: Ref<bigint[]> = ref([]);
const modalOpen = ref(false);
const modalType: Ref<'success' | 'error'> = ref('success');

/** 逐个通知成员：把频道成员转成私聊后逐个发送。 */
async function sendToPrivateChats(): Promise<number> {
  const seen = new Set<string>();
  const STEP = 30;
  const { content, unreactive } = input.value;
  let errorCount = 0;
  for (const { guild, chat } of input.value.targets) {
    if (!guild) continue;
    let start = 1;
    let end = STEP;
    // 每页拉满 30 人时继续翻页，不足 30 人说明已到末页
    for (;;) {
      let members: bigint[];
      try {
        members = await bot.getChannelMembers({
          guild,
          channel: chat,
          range: { start, end },
        });
      } catch (e) {
        console.error(e);
        errors.set('获取频道成员失败', (errors.get('获取频道成员失败') ?? 0) + 1);
        errorCount++;
        break;
      }
      const fresh = members.filter(v => !seen.has(String(v)));
      const chats: bigint[] = [];
      for (const target of fresh) {
        seen.add(String(target));
        try {
          chats.push(await bot.getPrivateChat({ target }));
        } catch (e) {
          console.error(e);
        }
      }
      total.value += chats.length;
      const res = await batchSend(chats, content, unreactive, () => current.value++);
      messages.value.push(...res.messages);
      for (const [k, v] of res.errors) {
        errors.set(k, (errors.get(k) ?? 0) + v);
      }
      errorCount += res.errorCount;
      if (members.length < STEP) break;
      start += STEP;
      end += STEP;
    }
  }
  return errorCount;
}

async function handleSubmit() {
  loading.value = true;
  current.value = 0;
  total.value = 0;
  errors.clear();
  messages.value = [];
  let errorCount = 0;

  if (input.value.toPrivateChats) {
    errorCount = await sendToPrivateChats();
  } else {
    const chats = input.value.targets.map(v => v.chat);
    total.value = chats.length;
    const res = await batchSend(
      chats,
      input.value.content,
      input.value.unreactive,
      () => current.value++,
    );
    messages.value = res.messages;
    for (const [k, v] of res.errors) errors.set(k, v);
    errorCount = res.errorCount;
  }

  modalType.value = errorCount >= total.value && total.value > 0 ? 'error' : 'success';
  modalOpen.value = true;
  loading.value = false;
}
</script>

<template>
  <div class='msg-wrapper'>
    <Modal
      v-model:visible='modalOpen'
      :title='modalType === "success" ? "发送成功" : "发送失败"'
      :esc-to-close='false'
      simple
      unmount-on-close
      hide-cancel
      @close='() => errors.clear()'
    >
      <template v-if='errors.size'>
        <template v-if='total > 1'>
          <TypographyParagraph>
            共 {{ total }} 条消息，其中 {{ total - messages.length }} 条发送失败。
          </TypographyParagraph>
          <List :data='Array.from(errors.keys())' size='small'>
            <template #header>
              <TypographyText class='font-bold'>失败原因</TypographyText>
            </template>
            <template #item='{ item }'>
              <ListItem>
                <TypographyText>{{ item }}</TypographyText>
                <template #actions>
                  <Badge :count='errors.get(item)' />
                </template>
              </ListItem>
            </template>
          </List>
        </template>
        <TypographyText v-else>
          失败原因：{{ Array.from(errors.keys())[0] }}
        </TypographyText>
      </template>
      <template v-else>
        <TypographyText v-if='messages.length === 1'>
          消息 ID：{{ messages[0] }}
        </TypographyText>
        <List
          v-else
          :data='messages'
          size='small'
          :pagination-props='{ pageSize: 5, total: messages.length }'
        >
          <template #header>
            <TypographyText class='font-bold'>消息 ID</TypographyText>
          </template>
          <template #item='{ item }'>
            <ListItem>
              <TypographyText>{{ item }}</TypographyText>
            </ListItem>
          </template>
        </List>
      </template>
    </Modal>

    <FeatureForm
      v-model='input'
      :loading='loading'
      :loading-text='`正在发送第 ${current} 条消息`'
      submit-text='发送'
      @submit='handleSubmit'
    >
      <FormItem field='targets' label='目标聊天' required :rules='[FORM_REQUIRE_RULE]'>
        <ChatSelector v-model='input.targets' />
      </FormItem>
      <FormItem field='content' label='消息内容' required :rules='[FORM_REQUIRE_RULE]'>
        <Textarea
          v-model='input.content'
          class='min-h-[5em]'
          :max-length='10240'
          auto-size
        />
      </FormItem>
      <FormItem field='unreactive' label='禁止表态' tooltip='开启后，消息无法被表态'>
        <Switch v-model='input.unreactive' />
      </FormItem>
      <FormItem
        field='toPrivateChats'
        label='逐个通知成员'
        tooltip='开启后，消息将私信发送给所选频道内的所有成员'
      >
        <Switch v-model='input.toPrivateChats' />
      </FormItem>
    </FeatureForm>
  </div>
</template>

<style scoped>
.msg-wrapper {
  width: 100%;
}
</style>
