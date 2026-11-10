<script lang="ts" setup>
import {
  Button,
  Empty,
  Input,
  Message,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  TypographyTitle,
} from '@arco-design/web-vue';
import {
  IconCopy,
  IconDelete,
  IconEdit,
  IconPlus,
  IconRefresh,
} from '@arco-design/web-vue/es/icon';

import type { GuildCredit } from '@starlight-dev-team/fanbook-api-sdk/dist/types';

import {
  clearCredits,
  listCredits,
  removeCredit,
  updateCredit,
  type CachedCredit,
} from '~/utils/credit-library';

definePageMeta({
  title: '勋章列表',
  requiredAuth: true,
});

const router = useRouter();
const route = useRoute();

/** 缓存中的勋章列表。 */
const items = ref([] as CachedCredit[]);
/** 搜索关键词（按名称 / ID 过滤）。 */
const keyword = ref('');

function reload() {
  items.value = listCredits();
}

onMounted(() => {
  reload();
});

/** 过滤后的展示列表。 */
const shown = computed(() => {
  const key = keyword.value.trim().toLowerCase();
  if (!key) return items.value;
  return items.value.filter(item =>
    item.id.toLowerCase().includes(key)
    || (item.credit.authority?.name ?? '').toLowerCase().includes(key),
  );
});

/** 编辑弹窗状态。 */
const editOpen = ref(false);
/** 正在编辑的原始 ID。 */
const editingId = ref('');
/** 编辑中的表单数据。 */
const editForm = reactive({
  id: '',
  authorityName: '',
  authorityIcon: '',
  titleIcon: '',
  slotImage: '',
  slotValue: '',
});

function openEdit(item: CachedCredit) {
  editingId.value = item.id;
  editForm.id = item.credit.id;
  editForm.authorityName = item.credit.authority?.name ?? '';
  editForm.authorityIcon = item.credit.authority?.icon ?? '';
  editForm.titleIcon = item.credit.title?.icon ?? '';
  editForm.slotImage = (item.credit.slots?.[0]?.[0] as any)?.image ?? '';
  editForm.slotValue = (item.credit.slots?.[0]?.[0] as any)?.value ?? '';
  editOpen.value = true;
}

function saveEdit() {
  const original = items.value.find(x => x.id === editingId.value);
  if (!original) return;
  const id = editForm.id.trim();
  if (!id) {
    Message.warning('勋章 ID 不能为空');
    return;
  }
  const next: GuildCredit = {
    id,
    authority: {
      name: editForm.authorityName,
      icon: editForm.authorityIcon,
    },
    title: {
      icon: editForm.titleIcon,
    },
    slots: [[{ image: editForm.slotImage, value: editForm.slotValue }]],
  } as GuildCredit;
  if (!updateCredit(editingId.value, next)) {
    Message.error('保存失败：未找到该缓存记录');
    return;
  }
  editOpen.value = false;
  reload();
  Message.success('已更新本地缓存');
}

/** 从缓存移除一条（仅本地，不影响服务器）。 */
function onRemove(id: string) {
  removeCredit(id);
  reload();
  Message.success('已从勋章列表移除');
}

/** 清空全部缓存。 */
function onClear() {
  clearCredits();
  reload();
  Message.success('已清空勋章列表');
}

/** 复制勋章 ID。 */
async function copyId(id: string) {
  try {
    await navigator.clipboard.writeText(id);
    Message.success('已复制 ID');
  } catch {
    Message.warning('复制失败，请手动选择复制');
  }
}

/** 带配置跳到修改页。 */
function quickModify(id: string) {
  router.push({ path: '/feature/modify-credit', query: { creditId: id } });
}

/** 带 ID 跳到删除页。 */
function quickDelete(id: string) {
  router.push({ path: '/feature/delete-credit', query: { creditId: id } });
}

/** 跳到设置荣誉页新增。 */
function goCreate() {
  router.push('/feature/set-credit');
}

function formatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleString('zh-CN');
  } catch {
    return '—';
  }
}
</script>

<template>
  <div class='library-wrapper'>
    <div class='library-head'>
      <div>
        <TypographyTitle :heading='3'>勋章列表</TypographyTitle>
        <p class='library-tip'>
          勋章配置保存在本浏览器（localStorage），不上传服务器。设置或修改勋章后会自动收录，
          可在这里一键带入「修改勋章 / 删除荣誉」页，省去重复输入图片链接与 ID。
        </p>
      </div>
      <Space wrap>
        <Button type='primary' @click='goCreate'>
          <template #icon><IconPlus /></template>
          新增勋章
        </Button>
        <Button @click='reload'>
          <template #icon><IconRefresh /></template>
          刷新
        </Button>
        <Popconfirm
          content='确定清空全部本地勋章缓存吗？此操作不会删除服务器上的勋章。'
          ok-text='清空'
          cancel-text='取消'
          @ok='onClear'
        >
          <Button status='danger' :disabled='!items.length'>清空</Button>
        </Popconfirm>
      </Space>
    </div>

    <Input
      v-model='keyword'
      class='library-search'
      allow-clear
      placeholder='按勋章名称或 ID 搜索'
    />

    <div v-if='shown.length' class='library-grid'>
      <div
        v-for='item in shown'
        :key='item.id'
        class='library-card'
      >
        <div class='library-card-top'>
          <img
            v-show='item.credit.title?.icon'
            class='library-badge'
            :src='item.credit.title?.icon'
            alt='勋章图片'
          >
          <div
            v-show='!item.credit.title?.icon'
            class='library-badge library-badge--empty'
          >
            无图
          </div>
          <div class='library-card-info'>
            <div class='library-name'>
              {{ item.credit.authority?.name || '未命名勋章' }}
            </div>
            <div class='library-time'>{{ formatTime(item.updatedAt) }}</div>
          </div>
        </div>

        <div class='library-id-row'>
          <span class='library-id' :title='item.id'>{{ item.id }}</span>
          <Tooltip content='复制 ID'>
            <Button type='text' size='mini' @click='copyId(item.id)'>
              <template #icon><IconCopy /></template>
            </Button>
          </Tooltip>
        </div>

        <div class='library-actions'>
          <Button type='primary' size='small' long @click='quickModify(item.id)'>
            快捷修改
          </Button>
          <Button status='danger' size='small' long @click='quickDelete(item.id)'>
            快捷删除
          </Button>
        </div>
        <div class='library-actions'>
          <Button size='small' long @click='openEdit(item)'>
            <template #icon><IconEdit /></template>
            编辑缓存
          </Button>
          <Popconfirm
            content='从本地列表移除这条记录？服务器上已发放的勋章不受影响。'
            ok-text='移除'
            cancel-text='取消'
            @ok='onRemove(item.id)'
          >
            <Button size='small' long>
              <template #icon><IconDelete /></template>
              移除
            </Button>
          </Popconfirm>
        </div>
      </div>
    </div>

    <Empty v-else class='library-empty'>
      <template #image>
        <Tag color='gray'>{{ keyword ? '没有匹配的勋章' : '暂无缓存' }}</Tag>
      </template>
      {{ keyword ? '换个关键词试试' : '去「设置荣誉」发放一枚勋章，或修改/删除页拉取一次用户勋章，就会自动出现在这里' }}
      <template #extra>
        <Button v-if='!keyword' type='primary' size='small' @click='goCreate'>
          去设置荣誉
        </Button>
      </template>
    </Empty>

    <Modal
      v-model:visible='editOpen'
      title='编辑本地勋章配置'
      :mask-closable='false'
      @ok='saveEdit'
    >
      <div class='edit-form'>
        <div class='edit-row'>
          <label>勋章 ID</label>
          <Input v-model='editForm.id' />
        </div>
        <div class='edit-row'>
          <label>标题栏文字</label>
          <Input v-model='editForm.authorityName' />
        </div>
        <div class='edit-row'>
          <label>标题栏图片链接</label>
          <Input v-model='editForm.authorityIcon' />
        </div>
        <div class='edit-row'>
          <label>勋章图片链接</label>
          <Input v-model='editForm.titleIcon' />
        </div>
        <div class='edit-row'>
          <label>插槽图片链接</label>
          <Input v-model='editForm.slotImage' />
        </div>
        <div class='edit-row'>
          <label>插槽图片描述</label>
          <Input v-model='editForm.slotValue' />
        </div>
        <p class='edit-tip'>仅修改浏览器本地缓存，不会同步到服务器。</p>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.library-wrapper {
  display: block;
  width: 70%;
  margin: 0 auto;
}
body.mobile .library-wrapper {
  width: 90vw;
}
.library-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.library-tip {
  max-width: 640px;
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--color-text-3);
}
.library-search {
  margin-bottom: 16px;
}
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}
.library-card {
  padding: 12px;
  border: 1px solid var(--color-border-2);
  border-radius: 10px;
  background: var(--color-bg-2);
}
.library-card-top {
  display: flex;
  align-items: center;
  gap: 10px;
}
.library-badge {
  flex: none;
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-fill-2);
}
.library-badge--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--color-text-3);
}
.library-card-info {
  min-width: 0;
  flex: 1;
}
.library-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.library-time {
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-3);
}
.library-id-row {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 10px 0;
  padding: 2px 4px 2px 8px;
  border-radius: 6px;
  background: var(--color-fill-1);
}
.library-id {
  flex: 1;
  min-width: 0;
  font-size: 11px;
  font-family: var(--winui-font, ui-monospace, monospace);
  color: var(--color-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.library-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.library-empty {
  margin-top: 40px;
}
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.edit-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.edit-row label {
  flex: none;
  width: 110px;
  font-size: 13px;
  color: var(--color-text-2);
}
.edit-tip {
  font-size: 12px;
  color: var(--color-text-3);
}
</style>
