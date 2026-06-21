<template>
  <div class="rich-text-editor">
    <!-- 工具栏 -->
    <div class="rte-toolbar" v-if="!disabled">
      <el-button-group>
        <el-button size="small" title="加粗" @click="exec('bold')"><strong>B</strong></el-button>
        <el-button size="small" title="斜体" @click="exec('italic')"><em>I</em></el-button>
        <el-button size="small" title="下划线" @click="exec('underline')"><u>U</u></el-button>
        <el-button size="small" title="删除线" @click="exec('strikeThrough')"><s>S</s></el-button>
      </el-button-group>

      <el-button-group>
        <el-button size="small" title="标题1" @click="exec('formatBlock', 'H1')">H1</el-button>
        <el-button size="small" title="标题2" @click="exec('formatBlock', 'H2')">H2</el-button>
        <el-button size="small" title="标题3" @click="exec('formatBlock', 'H3')">H3</el-button>
        <el-button size="small" title="正文" @click="exec('formatBlock', 'P')">正文</el-button>
      </el-button-group>

      <el-button-group>
        <el-button size="small" :icon="List" title="无序列表" @click="exec('insertUnorderedList')" />
        <el-button size="small" :icon="Operation" title="有序列表" @click="exec('insertOrderedList')" />
      </el-button-group>

      <el-button-group>
        <el-button size="small" :icon="Back" title="撤销" @click="exec('undo')" />
        <el-button size="small" :icon="Right" title="重做" @click="exec('redo')" />
      </el-button-group>

      <el-button size="small" :icon="Link" title="插入链接" @click="insertLink" />
      <el-button size="small" :icon="Delete" title="清除格式" @click="exec('removeFormat')" />
      <el-button size="small" @click="insertHR">分隔线</el-button>
    </div>

    <!-- 编辑区 -->
    <div
      ref="editorRef"
      class="rte-content"
      :class="{ 'is-disabled': disabled }"
      :contenteditable="!disabled"
      :style="{ height: typeof height === 'number' ? height + 'px' : height }"
      @input="onInput"
      @blur="onBlur"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { ElMessageBox } from 'element-plus'
import { List, Operation, Back, Right, Link, Delete } from '@element-plus/icons-vue'

const props = withDefaults(defineProps<{
  modelValue?: string
  height?: number | string
  disabled?: boolean
}>(), {
  modelValue: '',
  height: 400,
  disabled: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'blur', value: string): void
}>()

const editorRef = ref<HTMLDivElement | null>(null)
let isInternalChange = false

// 执行格式化命令
function exec(command: string, value?: string) {
  if (props.disabled) return
  editorRef.value?.focus()
  // @ts-ignore execCommand 已废弃但仍广泛支持，作为轻量富文本方案可接受
  document.execCommand(command, false, value)
  onInput()
}

// 插入链接
async function insertLink() {
  if (props.disabled) return
  try {
    const { value } = await ElMessageBox.prompt('请输入链接地址', '插入链接', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: 'https://example.com',
      inputPattern: /^https?:\/\/.+/,
      inputErrorMessage: '请输入有效的 http(s) 链接'
    })
    if (value) exec('createLink', value)
  } catch {
    // 用户取消
  }
}

// 插入水平分隔线
function insertHR() {
  exec('insertHorizontalRule')
}

// 输入事件
function onInput() {
  if (!editorRef.value) return
  isInternalChange = true
  emit('update:modelValue', editorRef.value.innerHTML)
}

// 失焦事件
function onBlur() {
  if (!editorRef.value) return
  emit('blur', editorRef.value.innerHTML)
}

// 外部值变化时同步到编辑器（避免内部触发时回环）
watch(
  () => props.modelValue,
  (newVal) => {
    if (isInternalChange) {
      isInternalChange = false
      return
    }
    if (editorRef.value && newVal !== editorRef.value.innerHTML) {
      editorRef.value.innerHTML = newVal || ''
    }
  }
)

onMounted(async () => {
  await nextTick()
  if (editorRef.value) {
    editorRef.value.innerHTML = props.modelValue || ''
  }
})
</script>

<style scoped>
.rich-text-editor {
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  overflow: hidden;
  background: var(--el-bg-color, #fff);
}

.rte-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-light, #f5f7fa);
}

.rte-content {
  padding: 12px 16px;
  overflow-y: auto;
  outline: none;
  line-height: 1.7;
  font-size: 14px;
  color: var(--el-text-color-primary, #303133);
}

.rte-content.is-disabled {
  background: var(--el-fill-color-lighter, #f5f7fa);
  cursor: not-allowed;
}

.rte-content :deep(h1) {
  font-size: 1.8em;
  margin: 0.6em 0 0.4em;
  font-weight: 700;
}
.rte-content :deep(h2) {
  font-size: 1.5em;
  margin: 0.6em 0 0.4em;
  font-weight: 700;
}
.rte-content :deep(h3) {
  font-size: 1.25em;
  margin: 0.6em 0 0.4em;
  font-weight: 600;
}
.rte-content :deep(h4) {
  font-size: 1.1em;
  margin: 0.6em 0 0.4em;
  font-weight: 600;
}
.rte-content :deep(p) {
  margin: 0.5em 0;
}
.rte-content :deep(ul),
.rte-content :deep(ol) {
  margin: 0.5em 0;
  padding-left: 2em;
}
.rte-content :deep(li) {
  margin: 0.25em 0;
}
.rte-content :deep(a) {
  color: var(--el-color-primary, #409eff);
  text-decoration: underline;
}
.rte-content :deep(strong) {
  font-weight: 700;
}
.rte-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--el-border-color, #dcdfe6);
  margin: 1em 0;
}
.rte-content :deep(blockquote) {
  border-left: 4px solid var(--el-color-primary, #409eff);
  padding-left: 1em;
  margin: 0.5em 0;
  color: var(--el-text-color-secondary, #909399);
}
</style>
