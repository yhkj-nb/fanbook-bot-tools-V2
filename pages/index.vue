<script lang="tsx" setup>
import { Card, Row, TypographyTitle } from '@arco-design/web-vue';

import {
  IconDelete,
  IconExclamationCircle,
  IconList,
  IconRefresh,
  IconRobot,
  IconSafe,
  IconStar,
} from '@arco-design/web-vue/es/icon';

/** 功能卡片数据。 */
export interface Feature {
  /** 卡片图标。 */
  icon: VNode;
  /** 卡片内容。 */
  content: string;
  /** 卡片右上角链接。 */
  link: string;
  /** 卡片角标（如 Beta）。 */
  tag?: string;
}

/**
 * 功能入口列表。
 */
const features: Array<{
  /** 分类标题。 */
  title: string;
  /** 分类图标。 */
  icon: VNode;
  /** 分类下属功能卡片数据。 */
  children: Feature[];
}> = [
  {
    title: '机器人',
    icon: <IconRobot size={18} />,
    children: [{
      icon: <IconRobot size={36} />,
      content: '资料信息',
      link: 'feature/get-bot-info',
    }],
  },
  {
    title: '荣誉卡槽',
    icon: <IconStar />,
    children: [{
      icon: <IconStar size={36} />,
      content: '设置荣誉',
      link: 'feature/set-credit',
    }, {
      icon: <IconDelete size={36} />,
      content: '删除荣誉',
      link: 'feature/delete-credit',
    }, {
      icon: <IconList size={36} />,
      content: '荣誉列表',
      link: 'feature/get-user-credit',
    }, {
      icon: <IconRefresh size={36} />,
      content: '修改勋章',
      link: 'feature/modify-credit',
    }],
  },
  {
    title: '运营工具',
    icon: <IconSafe size={18} />,
    children: [{
      icon: <IconExclamationCircle size={36} />,
      content: '风险检测',
      tag: 'Beta',
      link: 'feature/risk-check',
    }],
  },
];
</script>

<template>
  <div class='home w-11/12 mx-auto my-0'>
    <Row v-for='row in features'>
      <Card class='w-full mb-5' :title='row.title'>
        <Card
          v-for='item in row.children'
          class='home-card card inline-flex w-24 h-24 mr-4 cursor-pointer'
          @click='() => $router.push(item.link)'
        >
          <span v-if='item.tag' class='home-card-tag'>{{ item.tag }}</span>
          <component :is='item.icon' />
          <p class='mb-1 mt-auto'>{{ item.content }}</p>
        </Card>
        <template #title>
          <TypographyTitle class='w-full m-0 text-lg font-bold' :heading='2'>
            <component :is='row.icon' />
            {{ row.title }}
          </TypographyTitle>
        </template>
      </Card>
    </Row>
  </div>
</template>

<style lang="postcss" scoped>
.card:deep() > .arco-card-body {
  @apply w-full h-full;
  @apply inline-flex;
  @apply items-center;
  @apply flex-col;
}
.home-card {
  position: relative;
}
.home-card-tag {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .5px;
  color: #fff;
  padding: 1px 7px;
  border-radius: 10px;
  background: rgb(var(--danger-6));
}
</style>
