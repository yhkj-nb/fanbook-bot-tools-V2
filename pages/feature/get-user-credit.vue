<script lang="tsx" setup>
import { Bot } from '@starlight-dev-team/fanbook-api-sdk';
import type { GuildCredit } from '@starlight-dev-team/fanbook-api-sdk/dist/types';
import { useAccountStore } from '~~/stores/account';

import { tryBigintify } from '~~/utils/util';

import {
  Button,
  Form,
  FormItem,
  Message,
  Spin,
  TypographyTitle,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

definePageMeta({
  title: '获取荣誉列表',
  requiredAuth: true,
});

interface Input {
  guild?: bigint;
  users: bigint[];
}
const input = reactive({
  users: [] as bigint[],
} as Input);

const REQUEIRE_RULE: FieldRule = {
  required: true,
  message: '本项必填',
};

type Status = 'default' | 'loading';
const status = ref('default' as Status);

const bot = new Bot(useAccountStore().activeBotToken as string);

/** 聚合结果：每个用户及其勋章 ID 列表。 */
const results = ref([] as Array<{ user: string; ids: string[] }>);

function bigintValidator(value: string, cb: (error?: string) => void) {
  if (tryBigintify(value) === undefined) cb('数据填写错误');
  else cb(undefined);
}

async function onSubmit() {
  status.value = 'loading';
  const ids = input.users;
  if (!input.guild || !ids.length) {
    Message.warning({
      content: '请至少选择一名目标用户',
      duration: 2500,
    });
    status.value = 'default';
    return;
  }
  results.value = [];
  let fail = 0;
  for (const uid of ids) {
    try {
      const res: GuildCredit[] = await bot.getGuildUserCredit({
        guild: input.guild as bigint,
        user: uid as bigint,
      });
      results.value.push({ user: String(uid), ids: res.map(c => c.id) });
    } catch (err: any) {
      fail++;
      console.error(err);
    }
  }
  status.value = 'default';
  if (fail > 0) {
    Message.warning({
      content: `${ids.length - fail} 个成功，${fail} 个失败`,
      duration: 6000,
    });
  } else {
    Message.success({
      content: '获取完成',
      duration: 2500,
    });
  }
}
</script>

<template>
  <Spin
    class='form-wrapper'
    :loading='status === "loading"'
    tip='正在获取'
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
        v-model='input.users'
        :guild='input.guild'
        field='users'
        multiple
        required
      />
      <FormItem class='operations'>
        <Button
          type='primary'
          html-type='submit'
        >
          获取荣誉列表
        </Button>
      </FormItem>
    </Form>

    <template v-if='results.length'>
      <TypographyTitle :heading='4'>结果（共 {{ results.length }} 个用户）</TypographyTitle>
      <div
        v-for='r in results'
        :key='r.user'
        class='result-block'
      >
        <div class='result-user'>用户 {{ r.user }}</div>
        <div
          v-if='r.ids.length'
          class='result-ids'
        >
          <span
            v-for='id in r.ids'
            :key='id'
            class='result-id-tag'
          >{{ id }}</span>
        </div>
        <div
          v-else
          class='result-empty'
        >
          该用户暂无任何勋章
        </div>
      </div>
    </template>
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
.result-block {
  margin-bottom: 14px;
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-2);
}
.result-user {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-bottom: 8px;
}
.result-ids {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.result-id-tag {
  font-size: 12px;
  color: var(--color-text-3);
  padding: 1px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
  word-break: break-all;
}
.result-empty {
  font-size: 13px;
  color: var(--color-text-3);
}
</style>
