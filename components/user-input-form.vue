<!--
  表单内的目标用户字段。
  单一输入框同时支持：
  - 输入用户名 / 昵称 → 搜索服务器成员，下拉选择后自动回填用户 ID 与头像；
  - 输入完整用户 ID（≥ 15 位）→ 直接识别；
  - 输入用户短 ID → 优先尝试解析。
-->

<script lang="ts" setup>
import {
  Button,
  FormItem,
  Input,
  Option,
  Select,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

import { getCurrentBot, searchGuildMembers, type SearchedUser } from '~/utils/bot';

export type RuleType = FieldRule<bigint | undefined>;
export interface Props {
  /** 当前获取到的用户 ID 。 */
  modelValue?: bigint;
  /** 用户所在服务器 ID 。 */
  guild?: bigint;
  // 以下透传
  field: string;
  label?: string;
  required?: boolean;
  rules?: RuleType[];
}

const props = withDefaults(defineProps<Props>(), {
  label: '目标用户',
  required: false,
  rules: () => [],
});

const emit = defineEmits([
  'update:model-value',
]);

/** 字段状态。 */
type Status = 'error' | 'success' | 'warning' | 'validating' | undefined;

/** 输入框文本。 */
const text = ref(props.modelValue ? String(props.modelValue) : '');
/** 已确认的用户（搜索选中时带昵称与头像）。 */
const picked = ref(undefined as SearchedUser | undefined);
/** 搜索候选列表。 */
const results = ref([] as SearchedUser[]);
/** 是否正在搜索。 */
const searching = ref(false);
/** 自定义提示文本。 */
const hint = ref('');
/** 字段状态（手动控制，避免输入过程中误报「本项必填」）。 */
const status = ref(undefined as Status);

/** 合并属性到 rules 中。 */
function wrapRules(rules: RuleType[]): RuleType[] {
  const result = [ ...rules ];
  if (props.required) {
    result.push({
      required: true,
      message: '本项必填',
    });
  }
  return result;
}
const rules = wrapRules(props.rules);

/** 确认并写入用户 ID 。 */
function setUser(id: bigint, user?: SearchedUser) {
  picked.value = user ?? {
    id: String(id),
    name: '',
    username: '',
    avatar: '',
  };
  text.value = String(id);
  results.value = [];
  hint.value = '';
  status.value = 'success';
  emit('update:model-value', id);
}

/** 输入变化：与已确认的用户 ID 不一致时作废当前选择。 */
function onInput(v: string) {
  text.value = v;
  const value = v.trim();
  if (picked.value && value !== picked.value.id) {
    picked.value = undefined;
    results.value = [];
    emit('update:model-value', undefined);
  }
  if (!value) {
    picked.value = undefined;
    results.value = [];
    status.value = undefined;
    hint.value = '';
  } else if (status.value === 'error') { // 用户重新输入，先清掉上一次的报错
    status.value = undefined;
    hint.value = '';
  }
}

/** 从候选中选中某个用户。 */
function onPick(value: unknown) {
  const key = String(value);
  const user = results.value.find(u => u.id === key);
  if (user) setUser(BigInt(user.id), user);
}

/** 解析输入内容：用户 ID / 短 ID / 用户名搜索。 */
async function resolveInput() {
  const query = text.value.trim();
  if (!query) {
    status.value = 'error';
    hint.value = '请输入用户名 / 昵称，或直接填写用户 ID';
    return;
  }
  // 完整用户 ID（雪崩 ID）直接识别
  if (/^\d{15,}$/.test(query)) {
    try {
      setUser(BigInt(query));
    } catch {
      status.value = 'error';
      hint.value = '用户 ID 格式不正确';
    }
    return;
  }
  if (!props.guild) {
    status.value = 'error';
    hint.value = '请先填写服务器 ID';
    return;
  }
  searching.value = true;
  try {
    // 短 ID 优先尝试解析
    if (/^\d+$/.test(query)) {
      try {
        const user = await getCurrentBot().getUserByShortId({
          guild: props.guild,
          id: Number(query),
        });
        setUser(user);
        searching.value = false;
        return;
      } catch { // 解析失败则继续按用户名搜索
        // 忽略错误
      }
    }
    // 按用户名 / 昵称搜索成员
    const list = await searchGuildMembers(props.guild, query);
    results.value = list;
    if (list.length === 0) {
      // 无匹配：仅用行内提示，不再弹出 toast
      status.value = 'error';
      hint.value = '未找到该用户，请检查用户名或改用用户 ID';
    } else if (list.length === 1) {
      setUser(BigInt(list[0].id), list[0]);
    }
  } catch {
    // 搜索异常：仅用行内提示，不再弹出 toast
    status.value = 'error';
    hint.value = '搜索失败，请稍后重试';
  }
  searching.value = false;
}
</script>

<template>
  <FormItem
    v-bind='$attrs'
    :field='field'
    :label='label'
    :required='required'
    :rules='rules'
    :validate-status='status'
    :validate-trigger='[]'
  >
    <div class='user-field'>
      <div class='user-search'>
        <Input
          :model-value='text'
          placeholder='搜索用户名 / 昵称，或输入用户 ID'
          allow-clear
          @input='onInput'
          @press-enter='resolveInput'
          @clear='() => onInput("")'
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
          @click='resolveInput'
        >
          搜索
        </Button>
      </div>

      <!-- 搜索结果（多个候选时）：独占一行，显示在搜索框下方 -->
      <Select
        v-if='results.length > 1'
        class='user-search-select'
        placeholder='从匹配结果中选择用户'
        allow-search
        :trigger-props='{ contentClass: "user-search-dropdown" }'
        @change='onPick'
      >
        <Option
          v-for='u in results'
          :key='u.id'
          :value='u.id'
        >
          <span class='user-search-result'>
            <img
              v-if='u.avatar'
              class='user-search-avatar'
              :src='u.avatar'
              :alt='u.name'
            >
            <span class='user-search-meta'>
              <span>{{ u.name }}</span>
              <span class='user-search-id'>{{ u.id }}</span>
            </span>
          </span>
        </Option>
      </Select>

      <!-- 已确认的用户 -->
      <div v-if='picked' class='user-picked'>
        <img
          v-if='picked.avatar'
          class='user-picked-avatar'
          :src='picked.avatar'
          :alt='picked.name'
        >
        <div class='user-picked-meta'>
          <span class='user-picked-name'>{{ picked.name || '已选择用户' }}</span>
          <span class='user-picked-id'>#{{ picked.id }}</span>
        </div>
        <a class='user-picked-clear' @click='onInput("")'>清除</a>
      </div>
      <div v-else-if='hint' class='user-hint'>
        {{ hint }}
      </div>
    </div>
  </FormItem>
</template>

<style scoped>
/* 纵向排列：搜索行 → 匹配结果下拉 → 已选用户，逐行堆叠不并排 */
.user-field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  min-width: 0;
}
.user-search {
  display: flex;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 0;
}
.user-search :deep(.arco-input-wrapper) {
  flex: 1 1 auto;
  min-width: 0;
  height: 38px;
  padding: 0 8px 0 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
  background: #fff;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.user-search :deep(.arco-input-wrapper:hover) {
  border-color: #bcbcbc;
}
.user-search :deep(.arco-input-wrapper:focus-within) {
  border-color: var(--winui-accent) !important;
  box-shadow: 0 0 0 3px rgba(0, 120, 212, .15) !important;
}
.user-search :deep(.arco-input) {
  font-size: 14px;
}
.user-search-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 6px;
  color: var(--color-text-3);
}
.user-search :deep(.arco-btn) {
  flex: none;
  height: 38px;
  padding: 0 18px;
}
.user-search-select {
  display: block;
  width: 100%;
  margin-bottom: 0;
}
.user-search-select :deep(.arco-select-view) {
  height: 38px;
  padding-left: 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
  transition: border-color .15s ease, box-shadow .15s ease;
}
.user-search-select :deep(.arco-select-view.arco-select-view-focus) {
  border-color: var(--winui-accent) !important;
  box-shadow: 0 0 0 3px rgba(0, 120, 212, .15) !important;
}
.user-picked {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 0;
  padding: 8px 12px;
  border: 1px solid rgba(0, 120, 212, .25);
  border-radius: 6px;
  background: rgba(0, 120, 212, .06);
}
/* 昵称与 ID 纵向排列（不并排），窄屏自动换行到下一行 */
.user-picked-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.user-picked-avatar {
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-fill-2);
}
.user-picked-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-1);
  word-break: break-word;
}
.user-picked-id {
  font-size: 12px;
  color: var(--color-text-3);
}
.user-picked-clear {
  margin-left: auto;
  font-size: 12px;
  color: var(--winui-accent, #0078d4);
  cursor: pointer;
}
.user-hint {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.4;
  color: rgb(var(--danger-6));
}
</style>
