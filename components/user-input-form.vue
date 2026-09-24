<script lang="ts" setup>
import {
  Button,
  FormItem,
  Input,
  Message,
  Option,
  Select,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

import { searchGuildMembers, type SearchedUser } from '~/utils/bot';

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

/** 当前输入的值。 */
const input = ref(props.modelValue?.toString());
/** 字段状态。 */
type Status = 'error' | 'success' | 'warning' | 'validating' | undefined;
const status = ref(undefined as Status);
/** 是否为错误的输入。 */
const badInput = ref(false);

/** 用户名搜索。 */
const searchQuery = ref('');
const searching = ref(false);
const results = ref([] as SearchedUser[]);
const picked = ref('');

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

function onChange(v: bigint) {
  badInput.value = false;
  status.value = 'success';
  emit('update:model-value', v);
}
function onError() {
  badInput.value = true;
  status.value = 'error';
}

/** 按用户名 / 昵称搜索服务器成员。 */
async function searchUsers() {
  const q = searchQuery.value.trim();
  if (!q) {
    Message.warning({ content: '请输入用户名或昵称', duration: 2000 });
    return;
  }
  if (!props.guild) {
    Message.warning({ content: '请先填写服务器 ID', duration: 2500 });
    return;
  }
  searching.value = true;
  try {
    const list = await searchGuildMembers(props.guild, q);
    results.value = list;
    if (list.length === 0) {
      Message.info({ content: '未找到匹配的用户', duration: 3000 });
    }
  } catch {
    Message.error({ content: '搜索失败，请稍后重试', duration: 3000 });
  }
  searching.value = false;
}

/** 从搜索结果中选中某个用户，自动填入用户 ID。 */
function onPick(val: any) {
  const id = String(val ?? '');
  if (!id) return;
  input.value = id;
  onChange(BigInt(id));
  searchQuery.value = '';
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
  >
    <template v-if='badInput' #help>
      用户不在此服务器内
    </template>
    <UserInput
      :model-value='modelValue'
      :guild='props.guild'
      @input='(v: string) => input = v'
      @change='onChange'
      @error='onError'
    />

    <!-- 按用户名搜索用户 -->
    <div class='user-search'>
      <Input
        v-model='searchQuery'
        placeholder='输入用户名 / 昵称搜索用户'
        allow-clear
        @press-enter='searchUsers'
      />
      <Button
        type='primary'
        :loading='searching'
        @click='searchUsers'
      >
        搜索
      </Button>
    </div>
    <Select
      v-if='results.length'
      v-model='picked'
      placeholder='选择用户（自动填入用户 ID）'
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
  </FormItem>
</template>
