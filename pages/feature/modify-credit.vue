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
  Image,
  Input,
  Message,
  TypographyTitle,
  Spin,
  Empty,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';

definePageMeta({
  title: '修改勋章',
  requiredAuth: true,
});

interface Input {
  guild?: bigint;
  user?: bigint;
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

type Status = 'default' | 'loading' | 'fetching';
const status = ref('default' as Status);

const bot = new Bot(useAccountStore().activeBotToken as string);

/** 该用户当前拥有的全部徽章。 */
const credits = ref([] as GuildCredit[]);
/** 当前选中的徽章 ID（用于高亮与编辑）。 */
const selectedId = ref('');

function generateId() {
  input.credit.id = nanoid();
}

function bigintValidator(value: string, cb: (error?: string) => void) {
  if (tryBigintify(value) === undefined) cb('数据填写错误');
  else cb(undefined);
}

/** 输入服务器 + 用户（短 ID 自动解析后）即可拉取该用户全部徽章及其图片。 */
async function fetchCredits() {
  if (!input.guild || !input.user) return;
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

/** 点击某个徽章，将其完整数据载入编辑表单。 */
function selectCredit(c: GuildCredit) {
  selectedId.value = c.id;
  input.credit = JSON.parse(JSON.stringify(c));
  // 保证插槽结构存在，便于编辑
  if (!input.credit.slots || input.credit.slots.length === 0) {
    input.credit.slots = [[{ image: '', value: '' }]];
  }
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
    await bot.setGuildUserCredit({
      guild: input.guild,
      user: input.user as bigint,
      credit: input.credit,
    });
    Message.success({
      content: '修改勋章成功',
      duration: 2500,
    });
    // 重新拉取，刷新徽章列表与图片
    await fetchCredits();
  } catch (err: any) {
    console.error(err);
    // 如果错误码在 BotErrorCode 中，则显示错误码对应的错误信息
    if (err.response?.data?.error_code in BotErrorCode) {
      Message.error({
        content: '修改勋章失败：' + BotErrorCode[err.response?.data?.error_code],
        duration: 6000,
      });
    } else {
      Message.error({
        content: '修改勋章失败：' + err.response?.data?.description,
        duration: 6000,
      });
    }
  }
  status.value = 'default';
}
</script>

<template>
  <Spin
    class='form-wrapper'
    :loading='status === "loading"'
    tip='正在修改勋章'
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

      <FormItem class='operations'>
        <Button
          :loading='status === "fetching"'
          @click='fetchCredits'
        >
          <template #icon>
            <IconRefresh />
          </template>
          获取用户徽章
        </Button>
      </FormItem>

      <TypographyTitle :heading='4'>该用户的全部徽章</TypographyTitle>
      <div
        v-if='credits.length'
        class='credit-grid'
      >
        <div
          v-for='c in credits'
          :key='c.id'
          class='credit-card'
          :class='{ active: c.id === selectedId }'
          @click='selectCredit(c)'
        >
          <Image
            v-if='c.title.icon'
            class='credit-img'
            :src='c.title.icon'
            width='72'
            height='72'
          />
          <div
            v-else
            class='credit-img credit-img--empty'
          >
            无图
          </div>
          <div class='credit-name'>
            {{ c.authority?.name || '未命名勋章' }}
          </div>
          <div class='credit-id'>
            {{ c.id }}
          </div>
          <Image
            v-if='c.authority?.icon'
            class='credit-authority'
            :src='c.authority.icon'
            width='20'
            height='20'
          />
        </div>
      </div>
      <Empty
        v-else
        description='暂无徽章，请先填写上方服务器与用户并点击「获取用户徽章」'
      />

      <template v-if='selectedId'>
        <TypographyTitle :heading='4'>
          修改勋章（{{ selectedId }}）
        </TypographyTitle>
        <FormItem
          label='勋章 ID'
          field='credit.id'
          tooltip='需为已下发的勋章 ID，修改时将覆盖该勋章'
          :rules='[REQUEIRE_RULE, { minLength: 10, message: "至少10字符" }]'
        >
          <Input v-model='input.credit.id'>
            <template #append>
              <Button
                type='text'
                @click='generateId'
              >
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
          tooltip='显示在昵称左侧的小图，即勋章图标'
        >
          <Input v-model='input.credit.title.icon' />
        </FormItem>
        <FormItem class='operations'>
          <Button
            type='primary'
            html-type='submit'
          >
            修改勋章
          </Button>
        </FormItem>
      </template>
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
.operations {
  margin-top: 4px;
}
.credit-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}
.credit-card {
  width: 108px;
  padding: 8px;
  border: 1px solid var(--color-border-2);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all .15s;
  background: var(--color-bg-2);
}
.credit-card:hover {
  border-color: var(--color-primary-light-3);
}
.credit-card.active {
  border-color: rgb(var(--primary-6));
  box-shadow: 0 0 0 2px rgba(var(--primary-6), .15);
}
.credit-img {
  margin: 0 auto 4px;
  border-radius: 6px;
  object-fit: cover;
}
.credit-img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  color: var(--color-text-3);
  background: var(--color-fill-2);
}
.credit-name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.credit-id {
  font-size: 11px;
  color: var(--color-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.credit-authority {
  margin-top: 4px;
  border-radius: 50%;
}
</style>
