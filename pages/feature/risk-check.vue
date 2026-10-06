<script lang="ts" setup>
import { BotErrorCode } from '~/utils/bot';
import { getCurrentBot } from '~/utils/bot';
import type { GuildRole } from '@starlight-dev-team/fanbook-api-sdk/dist/types';
import {
  Button,
  Form,
  FormItem,
  Message,
  Spin,
  TypographyTitle,
} from '@arco-design/web-vue';
import type { FieldRule } from '@arco-design/web-vue';
import {
  CheckResultLevel,
  checkRolePermissions,
  type CheckRolePermissionsResult,
} from '~/utils/feature/audit';

definePageMeta({
  title: '服务器风险检测',
  requiredAuth: true,
});

interface Input {
  guild?: bigint;
}
const input = reactive({} as Input);

const REQUEIRE_RULE: FieldRule = {
  required: true,
  message: '本项必填',
};

type Status = 'default' | 'loading';
const status = ref('default' as Status);

/** 检测到的身份组风险结果（已按风险等级排序）。 */
const results = ref([] as CheckRolePermissionsResult[]);
/** 服务器身份组总数。 */
const total = ref(0);

const levelText = ['安全', '低风险', '高风险'];
const highCount = computed(() => results.value.filter(r => r.level === CheckResultLevel.HIGH).length);
const lowCount = computed(() => results.value.filter(r => r.level === CheckResultLevel.LOW).length);
const safeCount = computed(() => results.value.filter(r => r.level === CheckResultLevel.SAFE).length);

async function onCheck() {
  if (!input.guild) {
    Message.warning({ content: '请先填写服务器 ID', duration: 2500 });
    return;
  }
  status.value = 'loading';
  results.value = [];
  try {
    const roles: GuildRole[] = await getCurrentBot().getGuildRoles({ guild: input.guild });
    total.value = roles.length;
    const list = roles
      .map(checkRolePermissions)
      .filter((r): r is CheckRolePermissionsResult => r !== undefined);
    // 高风险优先排序
    list.sort((a, b) => b.level - a.level);
    results.value = list;
    if (highCount.value > 0) {
      Message.warning({
        content: `检测完成：${highCount.value} 个身份组存在高风险权限`,
        duration: 4000,
      });
    } else {
      Message.success({
        content: '检测完成：未发现高风险身份组',
        duration: 3000,
      });
    }
  } catch (err: any) {
    console.error(err);
    const code = err.response?.data?.error_code;
    const desc = err.response?.data?.description ?? err.message ?? '未知错误';
    const msg = (code && BotErrorCode[code]) ? BotErrorCode[code] : desc;
    Message.error({ content: '检测失败：' + msg, duration: 6000 });
  }
  status.value = 'default';
}
</script>

<template>
  <Spin
    class='form-wrapper'
    :loading='status === "loading"'
    tip='正在检测服务器身份组权限'
  >
    <Form
      class='form'
      :model='input'
      :disabled='status === "loading"'
      auto-label-width
      @submit-success='onCheck'
    >
      <div class='beta-banner'>
        <span class='beta-badge'>Beta</span>
        <span class='beta-text'>实验性功能：检测结论由服务器身份组权限推算，仅供参考，请以服务器实际设置为准。</span>
      </div>

      <GuildInputForm
        v-model='input.guild'
        field='guild'
        required
      />

      <TypographyTitle :heading='4'>检测说明</TypographyTitle>
      <div class='intro'>
        遍历服务器全部身份组，按拥有的权限判断风险等级，帮助运营快速发现
        <b>高危权限</b>（超级管理员 / 移除和拉黑成员）与
        <b>低风险权限</b>（管理服务器 / 管理消息 / 管理身份组 / 管理圈子）。
        @everyone 与固定角色不参与检测。
      </div>

      <FormItem class='operations'>
        <Button
          type='primary'
          html-type='submit'
        >
          开始风险检测
        </Button>
      </FormItem>
    </Form>

    <template v-if='results.length'>
      <TypographyTitle :heading='4'>检测结果（共 {{ total }} 个身份组，{{ results.length }} 个纳入检测）</TypographyTitle>
      <div class='summary'>
        <div class='summary-item high'>
          <span class='summary-num'>{{ highCount }}</span>
          <span class='summary-label'>高风险</span>
        </div>
        <div class='summary-item low'>
          <span class='summary-num'>{{ lowCount }}</span>
          <span class='summary-label'>低风险</span>
        </div>
        <div class='summary-item safe'>
          <span class='summary-num'>{{ safeCount }}</span>
          <span class='summary-label'>安全</span>
        </div>
      </div>

      <div class='result-list'>
        <div
          v-for='r in results'
          :key='r.name'
          class='result-card'
          :class='{
            high: r.level === CheckResultLevel.HIGH,
            low: r.level === CheckResultLevel.LOW,
            safe: r.level === CheckResultLevel.SAFE,
          }'
        >
          <div class='result-head'>
            <span class='result-name'>{{ r.name }}</span>
            <span class='result-level'>
              {{ levelText[r.level] }}
            </span>
          </div>
          <div class='result-cause'>
            <span
              v-for='(c, i) in r.cause'
              :key='i'
              class='cause-tag'
            >{{ c }}</span>
          </div>
          <div
            v-if='r.permissions.length'
            class='result-permissions'
          >
            <span
              v-for='(p, i) in r.permissions'
              :key='i'
              class='perm-tag'
            >{{ p }}</span>
          </div>
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
h4 {
  margin-top: 0;
  padding-bottom: 2px;
  border-bottom: 1px solid var(--color-text-4);
  text-align: center;
}
.intro {
  margin-bottom: 12px;
  padding: 10px 12px;
  border: 1px dashed var(--color-border-2);
  border-radius: 8px;
  color: var(--color-text-2);
  font-size: 13px;
  line-height: 1.7;
  background: var(--color-fill-1);
}
.operations {
  margin-top: 4px;
}
.summary {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--color-border-2);
}
.summary-item.high {
  background: rgba(var(--danger-6), .08);
  border-color: rgba(var(--danger-6), .35);
}
.summary-item.low {
  background: rgba(255, 153, 0, .08);
  border-color: rgba(255, 153, 0, .35);
}
.summary-item.safe {
  background: rgba(0, 180, 0, .08);
  border-color: rgba(0, 180, 0, .35);
}
.summary-num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}
.summary-item.high .summary-num {
  color: rgb(var(--danger-6));
}
.summary-item.low .summary-num {
  color: rgb(255, 125, 0);
}
.summary-item.safe .summary-num {
  color: rgb(0, 160, 0);
}
.summary-label {
  font-size: 13px;
  color: var(--color-text-2);
}
.result-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.result-card {
  padding: 12px 14px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-2);
}
.result-card.high {
  border-color: rgba(var(--danger-6), .45);
  background: rgba(var(--danger-6), .05);
}
.result-card.low {
  border-color: rgba(255, 153, 0, .45);
  background: rgba(255, 153, 0, .05);
}
.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.result-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-1);
}
.result-level {
  flex: none;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}
.result-card.high .result-level {
  color: #fff;
  background: rgb(var(--danger-6));
}
.result-card.low .result-level {
  color: #fff;
  background: rgb(255, 125, 0);
}
.result-card.safe .result-level {
  color: #fff;
  background: rgb(0, 160, 0);
}
.result-cause {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}
.cause-tag {
  font-size: 12px;
  color: var(--color-text-2);
  padding: 2px 8px;
  border-radius: 6px;
  background: var(--color-fill-2);
}
.result-permissions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.perm-tag {
  font-size: 12px;
  color: var(--color-text-3);
  padding: 1px 8px;
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
}
.beta-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(var(--danger-6), .3);
  background: rgba(var(--danger-6), .06);
}
.beta-badge {
  flex: none;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .5px;
  color: #fff;
  padding: 2px 10px;
  border-radius: 12px;
  background: rgb(var(--danger-6));
}
.beta-text {
  font-size: 13px;
  color: var(--color-text-2);
  line-height: 1.5;
}
</style>
