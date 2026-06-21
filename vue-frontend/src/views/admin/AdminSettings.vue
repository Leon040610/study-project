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
      </el-tabs>
      <div class="save-bar">
        <el-button :icon="RefreshLeft" @click="reload">重置</el-button>
        <el-button type="primary" :icon="Check" :loading="saving" @click="save">保存设置</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, RefreshLeft } from '@element-plus/icons-vue'
import { api } from '@/utils/api'

const activeTab = ref('site')
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  site: { name: '', subtitle: '', description: '', icp: '', supportEmail: '', maintenance: false },
  security: { tokenTtlDays: 7, passwordMinLen: 8, maxLoginFail: 5, allowRegister: true, requireApproval: false },
  mail: { enabled: false, host: '', port: 465, secure: true, from: '', user: '', pass: '' }
})

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

onMounted(reload)
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
</style>
