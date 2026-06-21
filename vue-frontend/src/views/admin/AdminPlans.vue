<template>
  <div class="admin-plans">
    <div class="page-header">
      <h2>计划管理</h2>
    </div>
    <el-card>
      <el-table :data="plans" border v-loading="loading">
        <el-table-column prop="id" label="ID" width="150" />
        <el-table-column prop="title" label="计划名称" min-width="150" />
        <el-table-column prop="userName" label="创建者" width="120" />
        <el-table-column label="关联目标" min-width="150">
          <template #default="scope">
            {{ scope.row.goalTitle || scope.row.category || scope.row.goal || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="scope">
            <el-progress :percentage="Number(scope.row.progress) || 0" :color="getProgressColor(Number(scope.row.progress) || 0)" />
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status || '进行中' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="scope">{{ formatTime(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" @click="viewPlan(scope.row)">查看</el-button>
            <el-button size="small" type="danger" @click="deletePlan(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 计划详情对话框 -->
    <el-dialog v-model="detailVisible" title="计划详情" width="600px">
      <div v-if="selectedPlan" class="plan-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="计划ID">{{ selectedPlan.id }}</el-descriptions-item>
          <el-descriptions-item label="计划名称">{{ selectedPlan.title }}</el-descriptions-item>
          <el-descriptions-item label="创建者">{{ selectedPlan.userName || '未知用户' }}</el-descriptions-item>
          <el-descriptions-item label="关联目标">{{ selectedPlan.goalTitle || selectedPlan.category || selectedPlan.goal || '-' }}</el-descriptions-item>
          <el-descriptions-item label="开始日期">{{ selectedPlan.startDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="结束日期">{{ selectedPlan.endDate || '-' }}</el-descriptions-item>
          <el-descriptions-item label="进度">
            <el-progress :percentage="Number(selectedPlan.progress) || 0" />
          </el-descriptions-item>
          <el-descriptions-item label="状态">{{ selectedPlan.status || '进行中' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatTime(selectedPlan.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="计划描述">{{ selectedPlan.description || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'
import { ElMessage, ElMessageBox } from 'element-plus'

interface Plan {
  id: string
  title: string
  userName?: string
  userId?: string | number
  goalTitle?: string
  category?: string
  goal?: string
  progress?: number
  status?: string
  startDate?: string
  endDate?: string
  description?: string
  createdAt?: string
}

const plans = ref<Plan[]>([])
const loading = ref(false)
const detailVisible = ref(false)
const selectedPlan = ref<Plan | null>(null)

function formatTime(s?: string) {
  if (!s) return '-'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const pad = (n: number) => n < 10 ? '0' + n : '' + n
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function fetchPlans() {
  loading.value = true
  try {
    const data = await api.get('/plans')
    plans.value = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title || '未命名',
      userName: p.userName || '未知用户',
      userId: p.userId || p.user_id,
      goalTitle: p.goalTitle,
      category: p.category,
      goal: p.goal,
      progress: Number(p.progress) || 0,
      status: p.status || '进行中',
      startDate: p.startDate,
      endDate: p.endDate,
      description: p.description,
      createdAt: p.createdAt || p.created_at
    }))
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
    plans.value = []
  } finally {
    loading.value = false
  }
}

function getProgressColor(progress: number) {
  if (progress >= 80) return '#10b981'
  if (progress >= 50) return '#3b82f6'
  return '#f59e0b'
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    '进行中': '',
    '已完成': 'success',
    '已暂停': 'warning',
    '已取消': 'danger'
  }
  return map[status] || ''
}

async function viewPlan(plan: Plan) {
  try {
    const detail: any = await api.get(`/plans/${plan.id}`)
    selectedPlan.value = {
      ...plan,
      ...detail,
      userName: detail.userName || plan.userName || '未知用户'
    }
    detailVisible.value = true
  } catch (e: any) {
    // 接口失败时使用列表数据
    selectedPlan.value = plan
    detailVisible.value = true
  }
}

async function deletePlan(plan: Plan) {
  try {
    await ElMessageBox.confirm(`确定要删除计划「${plan.title}」吗？`, '删除确认', { type: 'warning' })
  } catch { return }
  try {
    await api.delete(`/plans/${plan.id}`)
    plans.value = plans.value.filter(p => p.id !== plan.id)
    ElMessage.success('删除成功')
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(fetchPlans)
</script>

<style scoped>
.admin-plans {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
}

.plan-detail {
  padding: 0 8px;
}
</style>
