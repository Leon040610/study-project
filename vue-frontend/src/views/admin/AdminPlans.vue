<template>
  <div class="admin-plans">
    <div class="page-header">
      <h2>计划管理</h2>
    </div>
    <el-card>
      <el-table :data="plans" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="计划名称" />
        <el-table-column prop="userName" label="创建者" />
        <el-table-column prop="goal" label="关联目标" />
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="scope">
            <el-progress :percentage="scope.row.progress" :color="getProgressColor(scope.row.progress)" />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewPlan(scope.row)">查看</el-button>
            <el-button size="small" type="danger" @click="deletePlan(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'

interface Plan {
  id: string
  title: string
  userName: string
  goal: string
  progress: number
  status: string
  created_at: string
}

const plans = ref<Plan[]>([])

async function fetchPlans() {
  try {
    const data = await api.get('/plans')
    plans.value = (data || []).map((p: any) => ({
      id: p.id,
      title: p.title,
      userName: p.user_id || '未知用户',
      goal: p.goal,
      progress: p.progress || 0,
      status: p.status || '进行中',
      created_at: p.created_at || ''
    }))
  } catch {
    plans.value = []
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

function viewPlan(plan: Plan) {
  ElMessage.info(`查看计划: ${plan.title}`)
}

async function deletePlan(plan: Plan) {
  await api.delete(`/plans/${plan.id}`).catch(() => {})
  plans.value = plans.value.filter(p => p.id !== plan.id)
  ElMessage.success('删除成功')
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
</style>