<template>
  <div class="reminders-page">
    <div class="page-header">
      <h2>学习提醒</h2>
      <el-button type="primary" @click="showRuleModal = true">
        <el-icon><Plus /></el-icon>
        <span>创建提醒规则</span>
      </el-button>
    </div>

    <!-- 通知偏好设置 -->
    <el-card class="prefs-card">
      <template #header>
        <div class="card-header">
          <el-icon><Setting /></el-icon>
          <span>通知偏好设置</span>
        </div>
      </template>
      <el-form :model="prefs" label-width="140px" v-loading="prefsLoading">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="默认提醒渠道">
              <el-radio-group v-model="prefs.defaultChannel">
                <el-radio-button value="email">邮件</el-radio-button>
                <el-radio-button value="push">手机推送</el-radio-button>
                <el-radio-button value="both">两者同时</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="默认提前提醒">
              <el-select v-model="prefs.advanceMinutes" style="width: 100%">
                <el-option label="15 分钟" :value="15" />
                <el-option label="30 分钟" :value="30" />
                <el-option label="1 小时" :value="60" />
                <el-option label="2 小时" :value="120" />
                <el-option label="1 天" :value="1440" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="免打扰开始">
              <el-time-picker
                v-model="quietStart"
                format="HH:mm"
                placeholder="22:00"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="免打扰结束">
              <el-time-picker
                v-model="quietEnd"
                format="HH:mm"
                placeholder="07:00"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item>
          <el-button type="primary" @click="savePrefs">保存偏好</el-button>
          <el-button @click="sendTestNotification">发送测试通知</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知统计 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总通知数</div>
      </div>
      <div class="stat-card stat-success">
        <div class="stat-value">{{ stats.sent }}</div>
        <div class="stat-label">发送成功</div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-value">{{ stats.retrying }}</div>
        <div class="stat-label">重试中</div>
      </div>
      <div class="stat-card stat-danger">
        <div class="stat-value">{{ stats.failed }}</div>
        <div class="stat-label">发送失败</div>
      </div>
    </div>

    <!-- 提醒规则列表 -->
    <el-card class="rules-card">
      <template #header>
        <div class="card-header">
          <el-icon><Bell /></el-icon>
          <span>提醒规则</span>
        </div>
      </template>
      <div v-if="rules.length === 0" class="empty-state">
        <el-icon style="font-size: 48px; color: var(--text-tertiary);"><Bell /></el-icon>
        <p>暂无提醒规则，点击右上角创建</p>
      </div>
      <el-table v-else :data="rules" border>
        <el-table-column label="触发类型" width="140">
          <template #default="{ row }">
            <el-tag :type="getTriggerTagType(row.triggerType)">
              {{ getTriggerLabel(row.triggerType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="触发条件" min-width="180">
          <template #default="{ row }">
            {{ formatTriggerCondition(row) }}
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="120">
          <template #default="{ row }">
            <el-tag :type="getChannelTagType(row.channel)" size="small">
              {{ getChannelLabel(row.channel) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="toggleRule(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="editRule(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteRule(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 通知日志 -->
    <el-card class="logs-card">
      <template #header>
        <div class="card-header">
          <el-icon><Document /></el-icon>
          <span>通知发送记录</span>
          <el-button size="small" style="margin-left: auto;" @click="fetchLogs">刷新</el-button>
        </div>
      </template>
      <el-table :data="logs" border v-loading="logsLoading">
        <el-table-column label="任务" min-width="180">
          <template #default="{ row }">
            {{ row.payload.taskTitle }}
          </template>
        </el-table-column>
        <el-table-column label="渠道" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.channel === 'email' ? 'primary' : 'success'">
              {{ row.channel === 'email' ? '邮件' : '推送' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="尝试次数" width="100">
          <template #default="{ row }">
            {{ row.attempts }} / {{ row.maxAttempts }}
          </template>
        </el-table-column>
        <el-table-column label="发送时间" width="180">
          <template #default="{ row }">
            {{ row.sentAt ? formatDate(row.sentAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="错误信息" min-width="200">
          <template #default="{ row }">
            <span v-if="row.error" style="color: var(--color-danger); font-size: 12px;">{{ row.error }}</span>
            <span v-else style="color: var(--text-tertiary);">-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑规则弹窗 -->
    <el-dialog
      v-model="showRuleModal"
      :title="editingRule ? '编辑提醒规则' : '创建提醒规则'"
      width="600px"
    >
      <el-form :model="ruleForm" label-width="120px">
        <el-form-item label="触发类型">
          <el-radio-group v-model="ruleForm.triggerType">
            <el-radio value="before_due">截止前提醒</el-radio>
            <el-radio value="fixed_time">固定时间</el-radio>
            <el-radio value="recurring">周期性重复</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item v-if="ruleForm.triggerType === 'before_due'" label="提前时间">
          <el-select v-model="ruleForm.advanceMinutes" style="width: 100%">
            <el-option label="15 分钟" :value="15" />
            <el-option label="30 分钟" :value="30" />
            <el-option label="1 小时" :value="60" />
            <el-option label="2 小时" :value="120" />
            <el-option label="1 天" :value="1440" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="ruleForm.triggerType !== 'before_due'" label="触发时间">
          <el-time-picker
            v-model="ruleFormTime"
            format="HH:mm"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="ruleForm.triggerType === 'recurring'" label="重复频率">
          <el-radio-group v-model="ruleForm.frequency">
            <el-radio value="daily">每天</el-radio>
            <el-radio value="weekdays">工作日</el-radio>
            <el-radio value="weekly">每周一</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="通知渠道">
          <el-radio-group v-model="ruleForm.channel">
            <el-radio value="email">邮件</el-radio>
            <el-radio value="push">手机推送</el-radio>
            <el-radio value="both">两者同时</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="启用状态">
          <el-switch v-model="ruleForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRuleModal = false">取消</el-button>
        <el-button type="primary" @click="saveRule">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { api } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Bell, Setting, Document } from '@element-plus/icons-vue'

interface ReminderRule {
  id: string
  planId?: string
  triggerType: 'before_due' | 'fixed_time' | 'recurring'
  triggerTime?: string
  advanceMinutes?: number
  frequency?: 'daily' | 'weekdays' | 'weekly'
  channel: 'email' | 'push' | 'both'
  enabled: boolean
  createdAt: string
  updatedAt: string
}

interface UserPrefs {
  defaultChannel: 'email' | 'push' | 'both'
  advanceMinutes: number
  quietHoursStart?: string
  quietHoursEnd?: string
}

interface NotificationLog {
  id: string
  channel: 'email' | 'push'
  status: 'pending' | 'sent' | 'failed' | 'retrying'
  attempts: number
  maxAttempts: number
  error?: string
  createdAt: string
  sentAt?: string
  payload: {
    taskTitle: string
    dueDate: string
    priority: string
  }
}

const rules = ref<ReminderRule[]>([])
const logs = ref<NotificationLog[]>([])
const stats = ref({ total: 0, sent: 0, failed: 0, retrying: 0 })
const prefsLoading = ref(false)
const logsLoading = ref(false)
const showRuleModal = ref(false)
const editingRule = ref<ReminderRule | null>(null)

const prefs = reactive<UserPrefs>({
  defaultChannel: 'both',
  advanceMinutes: 30,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00'
})

const quietStart = ref<Date | null>(null)
const quietEnd = ref<Date | null>(null)

const ruleForm = reactive({
  triggerType: 'before_due' as 'before_due' | 'fixed_time' | 'recurring',
  triggerTime: '',
  advanceMinutes: 30,
  frequency: 'daily' as 'daily' | 'weekdays' | 'weekly',
  channel: 'both' as 'email' | 'push' | 'both',
  enabled: true
})

const ruleFormTime = ref<Date | null>(null)

function timeToString(t: Date | null): string {
  if (!t) return ''
  const h = String(t.getHours()).padStart(2, '0')
  const m = String(t.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function stringToTime(s: string): Date | null {
  if (!s) return null
  const [h, m] = s.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d
}

function getTriggerLabel(type: string): string {
  const map: Record<string, string> = {
    before_due: '截止前提醒',
    fixed_time: '固定时间',
    recurring: '周期重复'
  }
  return map[type] || type
}

function getTriggerTagType(type: string): string {
  const map: Record<string, string> = {
    before_due: 'warning',
    fixed_time: 'primary',
    recurring: 'success'
  }
  return map[type] || 'info'
}

function getChannelLabel(channel: string): string {
  const map: Record<string, string> = {
    email: '邮件',
    push: '推送',
    both: '邮件+推送'
  }
  return map[channel] || channel
}

function getChannelTagType(channel: string): string {
  const map: Record<string, string> = {
    email: 'primary',
    push: 'success',
    both: 'info'
  }
  return map[channel] || 'info'
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: '待发送',
    sent: '已发送',
    failed: '失败',
    retrying: '重试中'
  }
  return map[status] || status
}

function getStatusTagType(status: string): string {
  const map: Record<string, string> = {
    pending: 'info',
    sent: 'success',
    failed: 'danger',
    retrying: 'warning'
  }
  return map[status] || 'info'
}

function formatTriggerCondition(rule: ReminderRule): string {
  if (rule.triggerType === 'before_due') {
    const mins = rule.advanceMinutes || 30
    if (mins >= 1440) return `截止前 ${mins / 1440} 天`
    if (mins >= 60) return `截止前 ${mins / 60} 小时`
    return `截止前 ${mins} 分钟`
  }
  if (rule.triggerType === 'fixed_time') {
    return `每天 ${rule.triggerTime || '00:00'}`
  }
  if (rule.triggerType === 'recurring') {
    const freqMap: Record<string, string> = {
      daily: '每天',
      weekdays: '工作日',
      weekly: '每周一'
    }
    return `${freqMap[rule.frequency || 'daily']} ${rule.triggerTime || '00:00'}`
  }
  return '-'
}

function formatDate(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchPrefs() {
  prefsLoading.value = true
  try {
    const data = await api.get('/reminders/preferences') as any
    Object.assign(prefs, data)
    quietStart.value = stringToTime(data.quietHoursStart || '22:00')
    quietEnd.value = stringToTime(data.quietHoursEnd || '07:00')
  } catch {
    // 首次访问会自动创建
  } finally {
    prefsLoading.value = false
  }
}

async function savePrefs() {
  prefsLoading.value = true
  try {
    await api.put('/reminders/preferences', {
      defaultChannel: prefs.defaultChannel,
      advanceMinutes: prefs.advanceMinutes,
      quietHoursStart: timeToString(quietStart.value),
      quietHoursEnd: timeToString(quietEnd.value)
    })
    ElMessage.success('偏好设置已保存')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    prefsLoading.value = false
  }
}

async function sendTestNotification() {
  try {
    await api.post('/reminders/test')
    ElMessage.success('测试通知已发送，请查看日志')
    setTimeout(fetchLogs, 1000)
    setTimeout(fetchStats, 1000)
  } catch {
    ElMessage.error('发送失败')
  }
}

async function fetchRules() {
  try {
    const data = await api.get('/reminders/rules')
    rules.value = data || []
  } catch {
    rules.value = []
  }
}

async function fetchLogs() {
  logsLoading.value = true
  try {
    const data = await api.get('/reminders/logs')
    logs.value = data || []
  } catch {
    logs.value = []
  } finally {
    logsLoading.value = false
  }
}

async function fetchStats() {
  try {
    const data = await api.get('/reminders/stats')
    stats.value = data || { total: 0, sent: 0, failed: 0, retrying: 0 }
  } catch {
    // ignore
  }
}

function editRule(rule: ReminderRule) {
  editingRule.value = rule
  Object.assign(ruleForm, {
    triggerType: rule.triggerType,
    triggerTime: rule.triggerTime || '',
    advanceMinutes: rule.advanceMinutes || 30,
    frequency: rule.frequency || 'daily',
    channel: rule.channel,
    enabled: rule.enabled
  })
  ruleFormTime.value = stringToTime(rule.triggerTime || '')
  showRuleModal.value = true
}

async function saveRule() {
  const payload = {
    triggerType: ruleForm.triggerType,
    triggerTime: ruleForm.triggerType !== 'before_due' ? timeToString(ruleFormTime.value) : undefined,
    advanceMinutes: ruleForm.triggerType === 'before_due' ? ruleForm.advanceMinutes : undefined,
    frequency: ruleForm.triggerType === 'recurring' ? ruleForm.frequency : undefined,
    channel: ruleForm.channel,
    enabled: ruleForm.enabled
  }

  try {
    if (editingRule.value) {
      await api.put(`/reminders/rules/${editingRule.value.id}`, payload)
      ElMessage.success('规则已更新')
    } else {
      await api.post('/reminders/rules', payload)
      ElMessage.success('规则已创建')
    }
    showRuleModal.value = false
    editingRule.value = null
    fetchRules()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function deleteRule(rule: ReminderRule) {
  try {
    await ElMessageBox.confirm('确定删除此提醒规则？', '提示', { type: 'warning' })
    await api.delete(`/reminders/rules/${rule.id}`)
    ElMessage.success('已删除')
    fetchRules()
  } catch {
    // cancelled
  }
}

async function toggleRule(rule: ReminderRule) {
  try {
    await api.put(`/reminders/rules/${rule.id}`, { enabled: rule.enabled })
    ElMessage.success(rule.enabled ? '已启用' : '已禁用')
  } catch {
    rule.enabled = !rule.enabled
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  console.log('[Reminders] Component mounted')
  fetchPrefs()
  fetchRules()
  fetchLogs()
  fetchStats()
})

onBeforeUnmount(() => {
  console.log('[Reminders] Component about to unmount')
})
</script>

<style scoped>
.reminders-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.prefs-card,
.rules-card,
.logs-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px;
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.stat-success .stat-value { color: var(--color-success); }
.stat-warning .stat-value { color: var(--color-warning); }
.stat-danger .stat-value { color: var(--color-danger); }

.empty-state {
  text-align: center;
  padding: 48px 0;
  color: var(--text-tertiary);
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
