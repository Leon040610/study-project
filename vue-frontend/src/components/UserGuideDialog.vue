<template>
  <el-dialog
    v-model="visible"
    title="使用指南"
    width="800px"
    top="5vh"
    :class="{ 'guide-dialog-mobile': isMobile }"
    @open="handleOpen"
  >
    <div v-loading="loading" class="guide-container">
      <div v-if="meta.updatedAt" class="guide-meta">
        <el-icon><InfoFilled /></el-icon>
        <span>最后更新：{{ formatTime(meta.updatedAt) }}</span>
        <span v-if="meta.updatedBy" class="meta-by">· 编辑者：{{ meta.updatedBy }}</span>
      </div>
      <div v-if="content" class="guide-content" v-html="content"></div>
      <el-empty v-else-if="!loading" description="暂无使用指南内容" />
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { InfoFilled } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const isMobile = computed(() => window.innerWidth < 768)
const loading = ref(false)
const content = ref('')
const meta = ref<{ updatedAt: string | null; updatedBy: string | null }>({
  updatedAt: null,
  updatedBy: null
})

// 加载使用指南
async function loadGuide() {
  loading.value = true
  try {
    const data: any = await api.get('/guide')
    content.value = data?.content || ''
    meta.value = {
      updatedAt: data?.updatedAt || null,
      updatedBy: data?.updatedBy || null
    }
  } catch (e) {
    console.warn('[UserGuide] 加载失败', e)
  } finally {
    loading.value = false
  }
}

// 打开时加载
function handleOpen() {
  loadGuide()
}

// 格式化时间
function formatTime(s: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}年${m}月${day}日 ${hh}:${mm}`
}
</script>

<style scoped>
.guide-container {
  max-height: 70vh;
  overflow-y: auto;
  padding: 0 4px;
}

.guide-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 16px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}

.meta-by {
  margin-left: 4px;
}

.guide-content {
  line-height: 1.8;
  color: var(--el-text-color-primary, #303133);
  font-size: 14px;
}

.guide-content :deep(h2) {
  font-size: 22px;
  font-weight: 700;
  margin: 16px 0 12px;
  color: var(--el-color-primary, #409eff);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-color-primary-light-7, #d9ecff);
}

.guide-content :deep(h3) {
  font-size: 18px;
  font-weight: 700;
  margin: 20px 0 10px;
  color: var(--el-text-color-primary, #303133);
}

.guide-content :deep(h4) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--el-color-primary, #409eff);
}

.guide-content :deep(p) {
  margin: 8px 0;
}

.guide-content :deep(ul),
.guide-content :deep(ol) {
  margin: 8px 0;
  padding-left: 24px;
}

.guide-content :deep(li) {
  margin: 4px 0;
}

.guide-content :deep(strong) {
  font-weight: 700;
  color: var(--el-text-color-primary, #303133);
}

.guide-content :deep(em) {
  color: var(--el-text-color-secondary, #909399);
  font-style: italic;
}

.guide-content :deep(a) {
  color: var(--el-color-primary, #409eff);
  text-decoration: underline;
}

.guide-content :deep(code) {
  background: var(--el-fill-color-dark, #e6e8eb);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
}

.guide-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color, #dcdfe6);
  margin: 16px 0;
}

@media (max-width: 768px) {
  .guide-dialog-mobile {
    width: 95% !important;
  }
  .guide-container {
    max-height: 60vh;
  }
}
</style>
