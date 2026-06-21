<template>
  <div class="admin-settings">
    <h2 class="page-title">系统设置</h2>

    <el-alert
      type="success" :closable="false" show-icon
      title="所有设置项均已与系统实际功能关联，保存后立即生效。"
      style="margin-bottom: 16px"
    />

    <div v-loading="loading" class="settings-body">
      <el-tabs v-model="activeTab" tab-position="left" class="settings-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="site">
          <el-card>
            <template #header><span class="card-title">网站基本信息</span></template>
            <el-form :model="form.site" label-width="120px" style="max-width: 560px">
              <el-form-item label="网站名称">
                <el-input v-model="form.site.name" />
                <div class="form-tip">显示在登录页与浏览器标题</div>
              </el-form-item>
              <el-form-item label="网站副标题">
                <el-input v-model="form.site.subtitle" />
              </el-form-item>
              <el-form-item label="网站描述">
                <el-input v-model="form.site.description" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="ICP 备案号">
                <el-input v-model="form.site.icp" placeholder="如：京ICP备XXXXXXXX号" />
              </el-form-item>
              <el-form-item label="客服邮箱">
                <el-input v-model="form.site.supportEmail" />
              </el-form-item>
              <el-form-item label="维护模式">
                <el-switch v-model="form.site.maintenance" />
                <div class="form-tip warning">开启后普通用户无法登录，仅管理员可登录</div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 安全参数 -->
        <el-tab-pane label="安全参数" name="security">
          <el-card>
            <template #header><span class="card-title">安全与注册控制</span></template>
            <el-form :model="form.security" label-width="160px" style="max-width: 560px">
              <el-form-item label="JWT 有效期(天)">
                <el-input-number v-model="form.security.tokenTtlDays" :min="1" :max="60" />
                <div class="form-tip">登录 Token 过期天数，过期后需重新登录</div>
              </el-form-item>
              <el-form-item label="密码最小长度">
                <el-input-number v-model="form.security.passwordMinLen" :min="6" :max="32" />
                <div class="form-tip">新用户注册时强制校验</div>
              </el-form-item>
              <el-form-item label="登录失败上限">
                <el-input-number v-model="form.security.maxLoginFail" :min="3" :max="20" />
                <div class="form-tip">达到后锁定账号 30 分钟</div>
              </el-form-item>
              <el-form-item label="允许注册新用户">
                <el-switch v-model="form.security.allowRegister" />
                <div class="form-tip">关闭后注册接口将返回 403</div>
              </el-form-item>
              <el-form-item label="新注册需审核">
                <el-switch v-model="form.security.requireApproval" />
                <div class="form-tip">开启后新注册账号状态为 pending，需管理员在学生管理中激活</div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 邮件通知 -->
        <el-tab-pane label="邮件通知" name="mail">
          <el-card>
            <template #header><span class="card-title">SMTP 邮件配置</span></template>
            <el-form :model="form.mail" label-width="120px" style="max-width: 560px">
              <el-form-item label="启用邮件">
                <el-switch v-model="form.mail.enabled" />
                <div class="form-tip">关闭后系统不会尝试发送任何邮件</div>
              </el-form-item>
              <el-form-item label="SMTP 主机">
                <el-input v-model="form.mail.host" placeholder="smtp.example.com" />
              </el-form-item>
              <el-form-item label="SMTP 端口">
                <el-input-number v-model="form.mail.port" :min="1" :max="65535" />
              </el-form-item>
              <el-form-item label="使用 SSL">
                <el-switch v-model="form.mail.secure" />
              </el-form-item>
              <el-form-item label="发件人邮箱">
                <el-input v-model="form.mail.from" placeholder="noreply@example.com" />
              </el-form-item>
              <el-form-item label="用户名/授权">
                <el-input v-model="form.mail.user" />
              </el-form-item>
              <el-form-item label="密码/授权码">
                <el-input v-model="form.mail.pass" type="password" show-password />
              </el-form-item>
            </el-form>
            <el-alert type="info" :closable="false" style="margin-top: 8px">
              邮件配置保存后，系统通知服务将使用此 SMTP 参数发送邮件。需部署环境网络可访问对应 SMTP 服务器。
            </el-alert>
          </el-card>
        </el-tab-pane>

        <!-- 使用指南 -->
        <el-tab-pane label="使用指南" name="guide">
          <el-card v-loading="guideLoading">
            <template #header>
              <div class="guide-card-header">
                <span class="card-title">使用指南内容编辑</span>
                <div class="guide-header-actions">
                  <el-radio-group v-model="guideMode" size="small">
                    <el-radio-button label="edit">编辑</el-radio-button>
                    <el-radio-button label="preview">预览</el-radio-button>
                  </el-radio-group>
                  <el-button size="small" :icon="RefreshLeft" @click="resetGuide" :loading="guideResetting">
                    重置为默认
                  </el-button>
                </div>
              </div>
            </template>

            <div v-if="guideMeta.updatedAt" class="guide-meta">
              <el-icon><InfoFilled /></el-icon>
              <span>最后更新：{{ formatGuideTime(guideMeta.updatedAt) }}</span>
              <span v-if="guideMeta.updatedBy" class="meta-by">· 编辑者：{{ guideMeta.updatedBy }}</span>
            </div>

            <!-- 编辑模式 -->
            <div v-if="guideMode === 'edit'" class="guide-edit-area">
              <RichTextEditor
                v-model="guideContent"
                :height="500"
                @blur="onGuideBlur"
              />
              <div class="guide-edit-tip">
                <el-alert type="info" :closable="false" show-icon>
                  支持富文本格式：加粗、斜体、标题、列表、链接等。编辑后点击下方"保存指南"按钮生效，用户端将实时更新显示。
                </el-alert>
              </div>
            </div>

            <!-- 预览模式 -->
            <div v-else class="guide-preview-area">
              <div v-if="guideContent" class="guide-preview-content" v-html="guideContent"></div>
              <el-empty v-else description="暂无内容" />
            </div>

            <div class="guide-save-bar">
              <span class="guide-dirty-tip" v-if="guideDirty">
                <el-icon><WarningFilled /></el-icon>
                有未保存的修改
              </span>
              <el-button :icon="RefreshLeft" @click="reloadGuide" :disabled="guideSaving">重新加载</el-button>
              <el-button
                type="primary"
                :icon="Check"
                :loading="guideSaving"
                :disabled="!guideDirty"
                @click="saveGuide"
              >
                保存指南
              </el-button>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
      <div class="save-bar">
        <el-button :icon="RefreshLeft" @click="reload">重置</el-button>
        <el-button type="primary" :icon="Check" :loading="saving" @click="save">保存设置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, RefreshLeft, InfoFilled, WarningFilled } from '@element-plus/icons-vue'
import { api } from '@/utils/api'
import RichTextEditor from '@/components/RichTextEditor.vue'

const activeTab = ref('site')
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  site: { name: '', subtitle: '', description: '', icp: '', supportEmail: '', maintenance: false },
  security: { tokenTtlDays: 7, passwordMinLen: 8, maxLoginFail: 5, allowRegister: true, requireApproval: false },
  mail: { enabled: false, host: '', port: 465, secure: true, from: '', user: '', pass: '' }
})

// ========== 使用指南 ==========
const guideLoading = ref(false)
const guideSaving = ref(false)
const guideResetting = ref(false)
const guideMode = ref<'edit' | 'preview'>('edit')
const guideContent = ref('')
const guideOriginalContent = ref('') // 用于脏检查
const guideMeta = reactive<{ updatedAt: string | null; updatedBy: string | null }>({
  updatedAt: null,
  updatedBy: null
})

const guideDirty = computed(() => guideContent.value !== guideOriginalContent.value)

async function loadGuide() {
  guideLoading.value = true
  try {
    const data: any = await api.get('/guide')
    guideContent.value = data?.content || ''
    guideOriginalContent.value = data?.content || ''
    guideMeta.updatedAt = data?.updatedAt || null
    guideMeta.updatedBy = data?.updatedBy || null
  } catch (e: any) {
    ElMessage.error(e?.message || '加载使用指南失败')
  } finally {
    guideLoading.value = false
  }
}

async function reloadGuide() {
  if (guideDirty.value) {
    try {
      await ElMessageBox.confirm('当前有未保存的修改，确定要重新加载吗？未保存内容将丢失。', '提示', {
        type: 'warning'
      })
    } catch {
      return
    }
  }
  await loadGuide()
  ElMessage.success('已重新加载')
}

function onGuideBlur() {
  // 失焦时无需特殊处理，dirty 计算属性自动响应
}

async function saveGuide() {
  if (!guideContent.value.trim()) {
    ElMessage.warning('内容不能为空')
    return
  }
  guideSaving.value = true
  try {
    const data: any = await api.put('/admin/guide', { content: guideContent.value })
    if (data?.success) {
      guideContent.value = data.guide.content
      guideOriginalContent.value = data.guide.content
      guideMeta.updatedAt = data.guide.updatedAt
      guideMeta.updatedBy = data.guide.updatedBy
      ElMessage.success('使用指南已保存，用户端已实时更新')
    } else {
      ElMessage.error(data?.message || '保存失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    guideSaving.value = false
  }
}

async function resetGuide() {
  try {
    await ElMessageBox.confirm('确定要将使用指南重置为系统默认内容吗？此操作不可撤销。', '重置确认', {
      type: 'warning'
    })
  } catch {
    return
  }
  guideResetting.value = true
  try {
    const data: any = await api.post('/admin/guide/reset')
    if (data?.success) {
      guideContent.value = data.guide.content
      guideOriginalContent.value = data.guide.content
      guideMeta.updatedAt = data.guide.updatedAt
      guideMeta.updatedBy = data.guide.updatedBy
      ElMessage.success('已重置为默认内容')
    } else {
      ElMessage.error(data?.message || '重置失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '重置失败')
  } finally {
    guideResetting.value = false
  }
}

function formatGuideTime(s: string | null): string {
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

async function reload() {
  loading.value = true
  try {
    const data: any = await api.get('/admin/settings')
    if (data) {
      if (data.site) Object.assign(form.site, data.site)
      if (data.security) Object.assign(form.security, data.security)
      if (data.mail) Object.assign(form.mail, data.mail)
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await api.put('/admin/settings', form)
    ElMessage.success('设置已保存并立即生效')
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  reload()
  loadGuide()
})
</script>

<style scoped>
.admin-settings { padding: 8px 4px; }
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: var(--el-text-color-primary); }
.card-title { color: var(--el-text-color-primary); font-weight: 600; }
.settings-tabs :deep(.el-tabs__item) { padding: 0 24px !important; }
.save-bar {
  position: sticky; bottom: 0; padding: 12px 0; background: transparent;
  display: flex; gap: 8px; justify-content: flex-end;
}
.form-tip { margin-left: 8px; color: var(--el-text-color-placeholder); font-size: 12px; line-height: 1.4; }
.form-tip.warning { color: var(--el-color-warning); }

/* 使用指南 */
.guide-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.guide-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.guide-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  margin-bottom: 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary, #909399);
}
.guide-meta .meta-by { margin-left: 4px; }
.guide-edit-area { display: flex; flex-direction: column; gap: 12px; }
.guide-edit-tip { margin-top: 4px; }
.guide-preview-area {
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 4px;
  padding: 16px 24px;
  min-height: 500px;
  background: var(--el-bg-color, #fff);
}
.guide-preview-content {
  line-height: 1.8;
  color: var(--el-text-color-primary, #303133);
  font-size: 14px;
}
.guide-preview-content :deep(h2) {
  font-size: 22px;
  font-weight: 700;
  margin: 16px 0 12px;
  color: var(--el-color-primary, #409eff);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--el-color-primary-light-7, #d9ecff);
}
.guide-preview-content :deep(h3) {
  font-size: 18px;
  font-weight: 700;
  margin: 20px 0 10px;
}
.guide-preview-content :deep(h4) {
  font-size: 16px;
  font-weight: 600;
  margin: 16px 0 8px;
  color: var(--el-color-primary, #409eff);
}
.guide-preview-content :deep(p) { margin: 8px 0; }
.guide-preview-content :deep(ul),
.guide-preview-content :deep(ol) { margin: 8px 0; padding-left: 24px; }
.guide-preview-content :deep(li) { margin: 4px 0; }
.guide-preview-content :deep(strong) { font-weight: 700; }
.guide-preview-content :deep(em) { color: var(--el-text-color-secondary, #909399); font-style: italic; }
.guide-preview-content :deep(a) { color: var(--el-color-primary, #409eff); text-decoration: underline; }
.guide-preview-content :deep(hr) { border: none; border-top: 1px solid var(--el-border-color, #dcdfe6); margin: 16px 0; }
.guide-save-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color, #dcdfe6);
}
.guide-dirty-tip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-right: auto;
  color: var(--el-color-warning, #e6a23c);
  font-size: 13px;
}
</style>
