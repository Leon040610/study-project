<template>
  <div class="admin-settings">
    <h2 class="page-title">系统设置</h2>

    <div v-loading="loading" class="settings-body">
      <el-tabs v-model="activeTab" tab-position="left" class="settings-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="site">
          <el-card>
            <el-form :model="form.site" label-width="120px" style="max-width: 560px">
              <el-form-item label="网站名称">
                <el-input v-model="form.site.name" />
              </el-form-item>
              <el-form-item label="网站副标题">
                <el-input v-model="form.site.subtitle" />
              </el-form-item>
              <el-form-item label="网站描述">
                <el-input v-model="form.site.description" type="textarea" :rows="2" />
              </el-form-item>
              <el-form-item label="ICP 备案号">
                <el-input v-model="form.site.icp" />
              </el-form-item>
              <el-form-item label="客服邮箱">
                <el-input v-model="form.site.supportEmail" />
              </el-form-item>
              <el-form-item label="维护模式">
                <el-switch v-model="form.site.maintenance" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 安全参数 -->
        <el-tab-pane label="安全参数" name="security">
          <el-card>
            <el-form :model="form.security" label-width="160px" style="max-width: 560px">
              <el-form-item label="JWT 有效期(天)">
                <el-input-number v-model="form.security.tokenTtlDays" :min="1" :max="60" />
              </el-form-item>
              <el-form-item label="密码最小长度">
                <el-input-number v-model="form.security.passwordMinLen" :min="6" :max="32" />
              </el-form-item>
              <el-form-item label="登录失败上限">
                <el-input-number v-model="form.security.maxLoginFail" :min="3" :max="20" />
                <span class="form-tip">达到后锁定账号 30 分钟</span>
              </el-form-item>
              <el-form-item label="允许注册新用户">
                <el-switch v-model="form.security.allowRegister" />
              </el-form-item>
              <el-form-item label="新注册需审核">
                <el-switch v-model="form.security.requireApproval" />
              </el-form-item>
            </el-form>
          </el-card>
        </el-tab-pane>

        <!-- 邮件通知 -->
        <el-tab-pane label="邮件通知" name="mail">
          <el-card>
            <el-form :model="form.mail" label-width="120px" style="max-width: 560px">
              <el-form-item label="启用邮件">
                <el-switch v-model="form.mail.enabled" />
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
              邮件配置将在保存后生效。真实发送需要部署环境支持 SMTP 中继。
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
    ElMessage.success('设置已保存')
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
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
.settings-tabs :deep(.el-tabs__item) { padding: 0 24px !important; }
.save-bar {
  position: sticky; bottom: 0; padding: 12px 0; background: transparent;
  display: flex; gap: 8px; justify-content: flex-end;
}
.form-tip { margin-left: 8px; color: #9ca3af; font-size: 12px; }
</style>
