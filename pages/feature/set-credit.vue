<script lang="ts" setup>
import { IconRefresh } from '@arco-design/web-vue/es/icon';

import { nanoid } from 'nanoid';

import { Bot } from '@starlight-dev-team/fanbook-api-sdk';
import type {
  GuildCredit,
} from '@starlight-dev-team/fanbook-api-sdk/dist/types';

import { useAccountStore } from '~~/stores/account';

import { tryBigintify } from '~~/utils/util';
import {
  BotErrorCode,
  searchGuildMembers,
  type SearchedUser,
} from '~/utils/bot';

import {
  Button,
  Form,
  FormItem,
  Input,
  Message,
  Spin,
  TypographyTitle,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

definePageMeta({
  title: '设置荣誉卡槽',
  requiredAuth: true,
});

interface Input {
  guild?: bigint;
  credit: GuildCredit;
}
const input = reactive({
  credit: {
    id: '',
    authority: {
      icon: '',
      name: '',
    },
    slots: [[{
      image: '',
      value: '',
    }]],
    title: {
      icon: '',
    },
  },
} as Input);

const REQUEIRE_RULE: FieldRule = {
  required: true,
  message: '本项必填',
};

type Status = 'default' | 'loading';
const status = ref('default' as Status);

/** 批量发放进度。 */
const progress = reactive({ current: 0, total: 0 });

const bot = new Bot(useAccountStore().activeBotToken as string);

// ===== 多选用户（搜索 + 勾选）=====
/** 搜索关键词。 */
const query = ref('');
/** 是否正在搜索。 */
const searching = ref(false);
/** 搜索结果列表。 */
const results = ref([] as SearchedUser[]);
/** 已勾选的用户。 */
const selectedUsers = ref([] as SearchedUser[]);

function isSelected(id: string) {
  return selectedUsers.value.some(u => u.id === id);
}
/** 点击结果项：勾选 / 取消勾选。 */
function toggle(u: SearchedUser) {
  if (isSelected(u.id)) {
    selectedUsers.value = selectedUsers.value.filter(x => x.id !== u.id);
  } else {
    selectedUsers.value = [...selectedUsers.value, u];
  }
}
/** 移除已选用户。 */
function removeSelect(id: string) {
  selectedUsers.value = selectedUsers.value.filter(x => x.id !== id);
}

/** 按用户名 / 昵称搜索服务器成员，结果供逐个勾选。 */
async function searchMembers() {
  const q = query.value.trim();
  if (!q) {
    results.value = [];
    return;
  }
  if (!input.guild) {
    Message.warning({
      content: '请先填写服务器 ID',
      duration: 2500,
    });
    return;
  }
  searching.value = true;
  try {
    results.value = await searchGuildMembers(input.guild, q);
  } catch {
    results.value = [];
  }
  searching.value = false;
}

/** 输入框回车：完整用户 ID 直接加入已选；否则执行搜索。 */
async function resolveQuery() {
  const q = query.value.trim();
  if (!q) return;
  if (/^\d{15,}$/.test(q)) {
    // 雪崩 ID 直接识别并加入
    if (!isSelected(q)) {
      selectedUsers.value = [...selectedUsers.value, { id: q, name: '', username: '', avatar: '' }];
    }
    query.value = '';
    return;
  }
  await searchMembers();
}

function generateId() {
  input.credit.id = nanoid();
}

function bigintValidator(value: string, cb: (error?: string) => void) {
  if (tryBigintify(value) === undefined) cb('数据填写错误');
  else cb(undefined);
}

async function onSubmit() {
  status.value = 'loading';
  const ids = selectedUsers.value.map(u => BigInt(u.id));
  if (!input.guild || ids.length === 0) {
    Message.warning({
      content: '请至少勾选一个有效的目标用户',
      duration: 2500,
    });
    status.value = 'default';
    return;
  }
  progress.total = ids.length;
  progress.current = 0;
  let ok = 0;
  let fail = 0;
  const failures: string[] = [];
  for (const uid of ids) {
    progress.current++;
    try {
      await bot.setGuildUserCredit({
        guild: input.guild,
        user: uid,
        credit: input.credit,
      });
      ok++;
    } catch (err: any) {
      fail++;
      const code = err.response?.data?.error_code;
      const desc = err.response?.data?.description ?? '未知错误';
      const msg = (code && BotErrorCode[code]) ? BotErrorCode[code] : desc;
      if (!failures.includes(msg)) failures.push(msg);
      console.error(err);
    }
  }
  progress.current = progress.total;
  if (fail === 0) {
    Message.success({
      content: `已成功发放给 ${ok} 个用户`,
      duration: 3000,
    });
  } else {
    Message.warning({
      content: `${ok} 个成功，${fail} 个失败（${failures.slice(0, 2).join('；')}）`,
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
    :tip='progress.total ? `正在发放第 ${progress.current} / ${progress.total} 个用户` : "正在执行"'
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

      <TypographyTitle :heading='4'>目标用户（多选）</TypographyTitle>
      <div class='user-multi'>
        <div class='user-search'>
          <Input
            v-model='query'
            placeholder='搜索用户名 / 昵称，或输入用户 ID 后回车直接添加'
            allow-clear
            @press-enter='resolveQuery'
            @clear='() => { query = ""; results = []; }'
          >
            <template #prefix>
              <span class='user-search-icon' aria-hidden='true'>
                <svg viewBox='0 0 1024 1024' width='15' height='15'>
                  <path fill='currentColor' d='M448 64a384 384 0 0 1 307.2 614.4l219.9 219.9a42.7 42.7 0 0 1-60.4 60.4l-219.9-219.9A384 384 0 1 1 448 64zm0 85.3a298.7 298.7 0 1 0 0 597.4 298.7 298.7 0 0 0 0-597.4z' />
                </svg>
              </span>
            </template>
          </Input>
          <Button
            type='primary'
            :loading='searching'
            @click='searchMembers'
          >
            搜索
          </Button>
        </div>

        <!-- 搜索结果：逐个勾选 -->
        <div
          v-if='results.length'
          class='user-result-list'
        >
          <div
            v-for='u in results'
            :key='u.id'
            class='user-result'
            :class='{ selected: isSelected(u.id) }'
            @click='toggle(u)'
          >
            <img
              v-if='u.avatar'
              class='user-result-avatar'
              :src='u.avatar'
              :alt='u.name'
            >
            <div class='user-result-meta'>
              <span class='user-result-name'>{{ u.name || '未命名用户' }}</span>
              <span class='user-result-id'>{{ u.id }}</span>
            </div>
            <span class='user-result-check'>
              {{ isSelected(u.id) ? '✓ 已选' : '点击选择' }}
            </span>
          </div>
        </div>
        <div
          v-else-if='query && !searching'
          class='user-hint'
        >
          未找到匹配用户，可换关键词或改用用户 ID
        </div>

        <!-- 已选用户 -->
        <div
          v-if='selectedUsers.length'
          class='user-selected'
        >
          <div class='user-selected-title'>
            已选 {{ selectedUsers.length }} 人：
          </div>
          <div class='user-selected-list'>
            <span
              v-for='u in selectedUsers'
              :key='u.id'
              class='user-chip'
            >
              <img
                v-if='u.avatar'
                class='user-chip-avatar'
                :src='u.avatar'
                :alt='u.name'
              >
              <span class='user-chip-name'>{{ u.name || u.id }}</span>
              <a
                class='user-chip-remove'
                @click='removeSelect(u.id)'
              >×</a>
            </span>
          </div>
        </div>
      </div>

      <FormItem
        label='自定义 ID'
        field='credit.id'
        tooltip='荣誉卡槽唯一 ID ，修改/删除时需要此 ID'
        :rules='[REQUEIRE_RULE, { minLength: 10, message: "至少10字符" }]'
      >
        <Input v-model='input.credit.id'>
          <template #append>
            <Button type='text' @click='generateId'>
              <IconRefresh />
            </Button>
          </template>
        </Input>
      </FormItem>
      <TypographyTitle :heading='4'>标题栏配置</TypographyTitle>
      <FormItem
        label='标题栏图片链接'
        field='credit.authority.icon'
        :rules='REQUEIRE_RULE'
      >
        <Input v-model='input.credit.authority.icon' />
      </FormItem>
      <FormItem
        label='标题栏文字'
        field='credit.authority.name'
        :rules='REQUEIRE_RULE'
      >
        <Input v-model='input.credit.authority.name' />
      </FormItem>
      <TypographyTitle :heading='4'>插槽配置</TypographyTitle>
      <FormItem
        label='插槽图片链接'
        field='credit.slots[0][0].image'
      >
        <Input v-model='input.credit.slots[0][0].image' />
      </FormItem>
      <FormItem
        label='插槽图片描述'
        field='credit.slots[0][0].value'
      >
        <Input v-model='input.credit.slots[0][0].value' />
      </FormItem>
      <FormItem
        label='勋章图片链接'
        field='credit.title.icon'
        tooltip='显示在昵称左侧的小图'
      >
        <Input v-model='input.credit.title.icon' />
      </FormItem>
      <FormItem class='operations'>
        <Button
          type='primary'
          html-type='submit'
        >
          设置荣誉卡槽
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
h4 {
  margin-top: 0;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--color-text-4);
  text-align: center;
}
/* 多选用户：搜索行 + 结果勾选列表 + 已选标签 */
.user-multi {
  margin-bottom: 8px;
}
.user-search {
  display: flex;
  align-items: stretch;
  gap: 10px;
}
.user-search :deep(.arco-input-wrapper) {
  flex: 1 1 auto;
  min-width: 0;
  height: 38px;
  padding: 0 8px 0 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
  background: #fff;
}
.user-search :deep(.arco-btn) {
  flex: none;
  height: 38px;
  padding: 0 18px;
}
.user-search-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
  color: var(--color-text-3);
}
.user-result-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  background: var(--color-bg-2);
}
.user-result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all .12s;
}
.user-result:hover {
  background: var(--color-fill-1);
}
.user-result.selected {
  border-color: rgb(var(--primary-6));
  background: rgba(var(--primary-6), .08);
}
.user-result-avatar {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-fill-2);
}
.user-result-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.user-result-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-result-id {
  font-size: 12px;
  color: var(--color-text-3);
}
.user-result-check {
  margin-left: auto;
  flex: none;
  font-size: 12px;
  color: var(--color-text-3);
}
.user-result.selected .user-result-check {
  color: rgb(var(--primary-6));
  font-weight: 600;
}
.user-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-3);
}
.user-selected {
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 120, 212, .25);
  border-radius: 8px;
  background: rgba(0, 120, 212, .06);
}
.user-selected-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 8px;
}
.user-selected-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.user-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--color-border-2);
  border-radius: 16px;
  background: var(--color-bg-2);
}
.user-chip-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}
.user-chip-name {
  font-size: 12px;
  color: var(--color-text-1);
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-chip-remove {
  font-size: 14px;
  color: var(--color-text-3);
  cursor: pointer;
}
.user-chip-remove:hover {
  color: rgb(var(--danger-6));
}
.operations {
  margin-top: 4px;
}
</style>
