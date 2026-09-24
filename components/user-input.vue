<script lang="ts" setup>
import type { Bot } from '@starlight-dev-team/fanbook-api-sdk';

import { getCurrentBot } from '../utils/bot';

export interface Props {
  bot?: Bot;
  guild?: bigint;
  modelValue?: bigint;
}
const props = withDefaults(defineProps<Props>(), {
  bot: () => getCurrentBot(),
});

const emit = defineEmits([
  'update:model-value',
  /** 输入值改变时触发。 */
  'input',
  /** 输入值改变且输入正确时触发。 */
  'change',
  /** 输入值改变且输入错误时触发。 */
  'error',
]);

/** 当前输入的原始文本（用于精确解析大整数用户 ID）。 */
const raw = ref('');

function emitErrorEvent() {
  emit('error', raw.value);
}

/** 解析为用户 ID 并向上传递。 */
function updateUser(user: bigint) {
  emit('update:model-value', user);
  emit('change', user);
}

/**
 * 解析用户输入：
 * - 位数较多的数字（≥ 15 位）直接视作完整用户 ID（雪崩 ID），
 *   跳过短 ID 解析接口，避免官方限制 searchGuildMemberByName 时无法输入；
 * - 否则按短 ID 走 getUserByShortId 解析。
 */
async function resolve(value: string | undefined) {
  const text = (value ?? '').trim();
  raw.value = text;
  emit('input', text);
  if (!text) {
    emitErrorEvent();
    return;
  }
  if (/^\d{15,}$/.test(text)) { // 完整用户 ID
    try {
      updateUser(BigInt(text));
    } catch {
      emitErrorEvent();
    }
    return;
  }
  const id = Number(text);
  if (!props.guild || Number.isNaN(id)) { // 用户短 ID 是数值
    emitErrorEvent();
    return;
  }
  try {
    const user = await props.bot.getUserByShortId({
      guild: props.guild,
      id,
    });
    updateUser(user);
  } catch {
    emitErrorEvent();
  }
}

/** 回车 / 失焦时触发解析。 */
function onChange() {
  resolve(raw.value);
}
</script>

<template>
  <NumberInput
    @input='(v: string) => raw = v'
    @change='onChange'
  >
    <template #prefix>#</template>
  </NumberInput>
</template>
