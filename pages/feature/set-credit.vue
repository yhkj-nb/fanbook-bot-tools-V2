<script lang="ts" setup>
import { IconRefresh } from '@arco-design/web-vue/es/icon';

import { nanoid } from 'nanoid';

import { Bot } from '@starlight-dev-team/fanbook-api-sdk';
import type {
  GuildCredit,
} from '@starlight-dev-team/fanbook-api-sdk/dist/types';

import { useAccountStore } from '~~/stores/account';

import { tryBigintify } from '~~/utils/util';

import { BotErrorCode } from '~/utils/bot';

import {
  Button,
  Form,
  FormItem,
  Input,
  Message,
  TypographyTitle,
  Spin,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

definePageMeta({
  title: '设置荣誉卡槽',
  requiredAuth: true,
});

interface UserEntry {
  id?: bigint;
}
interface Input {
  guild?: bigint;
  users: UserEntry[];
  credit: GuildCredit;
}
const input = reactive({
  users: [{} as UserEntry],
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

function generateId() {
  input.credit.id = nanoid();
}

function bigintValidator(value: string, cb: (error?: string) => void) {
  if (tryBigintify(value) === undefined) cb('数据填写错误');
  else cb(undefined);
}

/** 新增一个用户选择框。 */
function addUser() {
  input.users.push({});
}
/** 移除指定下标的目标用户（至少保留一个）。 */
function removeUser(i: number) {
  if (input.users.length > 1) input.users.splice(i, 1);
}

async function onSubmit() {
  status.value = 'loading';
  const ids = input.users
    .map(u => u.id)
    .filter((v): v is bigint => v !== undefined);
  if (!input.guild || ids.length === 0) {
    Message.warning({
      content: '请至少选择一个有效的目标用户',
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
      const desc = err.response?.data?.description ?? '未知错误';
      const code = err.response?.data?.error_code;
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

      <TypographyTitle :heading='4'>目标用户（可多选）</TypographyTitle>
      <div
        v-for='(u, i) in input.users'
        :key='i'
        class='user-row'
      >
        <UserInputForm
          v-model='u.id'
          :guild='input.guild'
          :field='"users[" + i + "].id"'
          required
        />
        <Button
          v-if='input.users.length > 1'
          type='text'
          status='danger'
          class='user-remove'
          @click='removeUser(i)'
        >
          移除
        </Button>
      </div>
      <Button
        type='outline'
        long
        class='user-add'
        @click='addUser'
      >
        ＋ 添加用户
      </Button>

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
/* 每个用户选择框独占一行，右侧附带「移除」 */
.user-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.user-row :deep(.user-field) {
  flex: 1 1 auto;
  min-width: 0;
}
.user-remove {
  flex: none;
  margin-top: 0;
  height: 38px;
}
.user-add {
  margin: 10px 0 4px;
}
.operations {
  margin-top: 4px;
}
</style>
