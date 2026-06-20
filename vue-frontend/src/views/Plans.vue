<template>
  <div class="plans-page">
    <div class="page-header">
      <h2>学习计划管理</h2>
      <el-button type="primary" @click="showCreateModal = true">
        <el-icon><Plus /></el-icon>
        <span>创建计划</span>
      </el-button>
    </div>

    <div class="plans-list">
      <el-card v-for="plan in plans" :key="plan.id" class="plan-card">
        <div class="plan-header">
          <div class="plan-info">
            <h3>{{ plan.title }}</h3>
            <p>{{ plan.goal }}</p>
          </div>
          <el-tag :type="getStatusType(plan.status)">{{ plan.status }}</el-tag>
        </div>
        <div class="plan-meta">
          <span>📅 {{ plan.startDate }} ~ {{ plan.endDate }}</span>
          <span>✅ 进度：{{ plan.progress }}%</span>
        </div>
        <div class="progress-bar-container">
          <div class="progress-bar" :style="{ width: plan.progress + '%' }"></div>
        </div>
        <div class="plan-tasks">
          <h4>任务列表</h4>
          <div class="tasks-grid">
            <div
              v-for="task in plan.tasks"
              :key="task.id"
              class="task-item"
              :class="{ completed: isTaskCompletedToday(task) }"
            >
              <el-checkbox :model-value="isTaskCompletedToday(task)" @change="(val) => toggleTask(task, val)" />
              <div class="task-content">
                <span class="task-name">{{ task.title }}</span>
                <span class="task-period">{{ task.startDate }} ~ {{ task.endDate }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="plan-actions">
          <el-button size="small" @click="viewPlan(plan)">查看详情</el-button>
          <el-button size="small" @click="editPlan(plan)">编辑</el-button>
          <el-button size="small" type="danger" @click="deletePlan(plan)">删除</el-button>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showCreateModal" :title="editingPlan ? '编辑计划' : '创建计划'" width="700px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="计划名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入计划名称" />
        </el-form-item>
        <el-form-item label="关联目标" prop="goal">
          <el-select v-model="form.goal" placeholder="请选择关联目标（必选）" style="width: 100%">
            <el-option v-for="g in dataStore.goals" :key="g.id" :label="g.title" :value="g.title" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="startDate">
          <el-date-picker v-model="form.startDate" type="date" placeholder="选择开始日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker v-model="form.endDate" type="date" placeholder="选择结束日期" style="width: 100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="计划描述">
          <el-input type="textarea" v-model="form.description" :rows="3" placeholder="请输入计划描述" />
        </el-form-item>
        <el-form-item label="任务列表" required>
          <div style="width: 100%;">
            <div v-for="(task, index) in customTasks" :key="index" class="custom-task-row">
              <el-input 
                v-model="task.title" 
                placeholder="请输入任务名称（必填）" 
                style="flex: 1; margin-right: 8px;"
              />
              <el-date-picker
                v-model="task.startDate"
                type="date"
                placeholder="开始日期"
                style="width: 140px; margin-right: 8px;"
                :editable="false"
                value-format="YYYY-MM-DD"
              />
              <el-date-picker
                v-model="task.endDate"
                type="date"
                placeholder="结束日期"
                style="width: 140px; margin-right: 8px;"
                :editable="false"
                value-format="YYYY-MM-DD"
              />
              <el-button type="danger" size="small" @click="removeCustomTask(index)" :disabled="customTasks.length <= 1">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" size="small" @click="addCustomTask" style="margin-top: 8px;">
              <el-icon><Plus /></el-icon>
              <span>添加任务</span>
            </el-button>
            <p style="color: var(--text-tertiary); font-size: 12px; margin-top: 8px;">
              每个任务需设置独立的时间周期，任务会在其时间范围内的每一天显示在日历中
            </p>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailModal" title="计划详情" width="700px">
      <div v-if="selectedPlan" class="plan-detail">
        <div class="detail-header">
          <h3>{{ selectedPlan.title }}</h3>
          <el-tag :type="getStatusType(selectedPlan.status)">{{ selectedPlan.status }}</el-tag>
        </div>
        <div class="detail-info">
          <div class="info-item">
            <span class="label">关联目标：</span>
            <span>{{ selectedPlan.goal }}</span>
          </div>
          <div class="info-item">
            <span class="label">时间范围：</span>
            <span>{{ selectedPlan.startDate }} ~ {{ selectedPlan.endDate }}</span>
          </div>
          <div class="info-item">
            <span class="label">进度：</span>
            <span>{{ selectedPlan.progress }}%</span>
          </div>
          <div class="info-item">
            <span class="label">描述：</span>
            <span>{{ selectedPlan.description || '无' }}</span>
          </div>
        </div>
        <div class="detail-tasks">
          <h4>任务列表</h4>
          <div class="tasks-list">
            <div
              v-for="task in selectedPlan.tasks"
              :key="task.id"
              class="task-row"
              :class="{ completed: isTaskCompletedToday(task) }"
            >
              <el-checkbox :model-value="isTaskCompletedToday(task)" @change="(val) => toggleTask(task, val)" />
              <span class="task-title">{{ task.title }}</span>
              <span class="task-date">{{ task.startDate }} ~ {{ task.endDate }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useDataStore } from '@/stores/data'
import { Plus, Delete } from '@element-plus/icons-vue'

const dataStore = useDataStore()

interface Task {
  id: string
  title: string
  date: string
  completed: boolean
  startDate?: string
  endDate?: string
}

interface Plan {
  id: string
  title: string
  goal: string
  startDate: string
  endDate: string
  description: string
  status: string
  progress: number
  tasks: Task[]
}

const plans = ref<Plan[]>([])
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const editingPlan = ref<Plan | null>(null)
const selectedPlan = ref<Plan | null>(null)
const formRef = ref()

const form = reactive({
  title: '',
  goal: '',
  startDate: '',
  endDate: '',
  description: ''
})

// 自定义任务列表（每个任务有独立的时间周期）
const customTasks = ref<{ title: string; startDate: string; endDate: string }[]>([
  { title: '', startDate: '', endDate: '' }
])

function addCustomTask() {
  customTasks.value.push({ title: '', startDate: '', endDate: '' })
}

function removeCustomTask(index: number) {
  if (customTasks.value.length > 1) {
    customTasks.value.splice(index, 1)
  }
}

const rules = {
  title: [{ required: true, message: '请输入计划名称', trigger: 'blur' }],
  goal: [{ required: true, message: '请选择关联目标', trigger: 'change' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'blur' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'blur' }]
}

function updatePlans() {
  const result: Plan[] = []
  dataStore.plans.forEach(p => {
    const planTasks = dataStore.tasks.filter(t => t.planTitle === p.title)
    // 按"完全完成"统计进度：只有当任务周期内所有日期都被勾选，才计为完成
    const completedCount = planTasks.filter(t => dataStore.isTaskFullyCompleted(t)).length
    const progress = planTasks.length > 0 ? Math.round((completedCount / planTasks.length) * 100) : 0
    const isCompleted = progress === 100 && planTasks.length > 0
    result.push({
      id: p.id,
      title: p.title,
      goal: p.goalTitle || p.category || '未关联目标',
      startDate: p.startDate || '2026-06-01',
      endDate: p.endDate || '2026-12-31',
      description: p.description || '',
      status: isCompleted ? '已完成' : '进行中',
      progress,
      tasks: planTasks as unknown as Task[]
    })
  })
  plans.value = result
}

async function fetchData() {
  await dataStore.fetchAllData()
  updatePlans()
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})

  // 验证自定义任务
  const validTasks = customTasks.value.filter(t => t.title.trim() && t.startDate && t.endDate)
  if (validTasks.length === 0) {
    ElMessage.error('请至少添加一个完整的任务（名称、开始日期、结束日期都需填写）')
    return
  }

  // 检查是否有未完成的任务
  const incompleteTasks = customTasks.value.filter(t => !t.title.trim() || !t.startDate || !t.endDate)
  if (incompleteTasks.length > 0) {
    ElMessage.error('所有任务必须填写名称、开始日期和结束日期')
    return
  }

  try {
    const startDateStr = formatDate(form.startDate)
    const endDateStr = formatDate(form.endDate)

    // 验证日期范围
    const start = new Date(startDateStr)
    const end = new Date(endDateStr)
    if (end < start) {
      ElMessage.error('结束日期不能早于开始日期')
      return
    }

    if (editingPlan.value) {
      // ===== 编辑模式：在原计划基础上修改，删除旧任务并重建 =====
      const oldTitle = editingPlan.value.title
      const newTitle = form.title

      // 1. 更新计划本身
      await dataStore.updatePlan(editingPlan.value.id, {
        title: newTitle,
        category: form.goal || '技能学习',
        goalTitle: form.goal,
        startDate: startDateStr,
        endDate: endDateStr,
        description: form.description
      })

      // 2. 删除该计划的所有旧任务（按旧标题匹配，避免误删其他计划的任务）
      const oldTasks = dataStore.tasks.filter(t => t.planTitle === oldTitle)
      for (const oldTask of oldTasks) {
        await dataStore.deleteTask(oldTask.id)
      }

      // 3. 按表单新任务列表重建
      for (const task of validTasks) {
        const taskStartDate = formatDate(task.startDate)
        const taskEndDate = formatDate(task.endDate)

        await dataStore.addTask({
          title: task.title.trim(),
          planTitle: newTitle,
          date: taskStartDate,
          startDate: taskStartDate,
          endDate: taskEndDate
        })
      }

      ElMessage.success('修改成功')
    } else {
      // ===== 创建模式：保持原行为 =====
      await dataStore.addPlan({
        title: form.title,
        category: form.goal || '技能学习',
        goalTitle: form.goal,
        startDate: startDateStr,
        endDate: endDateStr,
        description: form.description
      })

      // 为每个自定义任务创建任务（每个任务有独立的时间周期）
      for (const task of validTasks) {
        const taskStartDate = formatDate(task.startDate)
        const taskEndDate = formatDate(task.endDate)

        await dataStore.addTask({
          title: task.title.trim(),
          planTitle: form.title,
          date: taskStartDate,
          startDate: taskStartDate,
          endDate: taskEndDate
        })
      }

      ElMessage.success('创建成功')
    }

    showCreateModal.value = false
    resetForm()
    updatePlans()
  } catch (e) {
    console.error(e)
    ElMessage.error('操作失败')
  }
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return ''
  if (typeof date === 'string') {
    // 兼容 ISO 字符串：取 YYYY-MM-DD 部分
    if (date.includes('T')) return date.split('T')[0]
    return date
  }
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function resetForm() {
  form.title = ''
  form.goal = ''
  form.startDate = ''
  form.endDate = ''
  form.description = ''
  customTasks.value = [{ title: '', startDate: '', endDate: '' }]
  editingPlan.value = null
}

function viewPlan(plan: Plan) {
  selectedPlan.value = plan
  showDetailModal.value = true
}

function editPlan(plan: Plan) {
  editingPlan.value = plan
  form.title = plan.title
  form.goal = plan.goal
  form.startDate = plan.startDate
  form.endDate = plan.endDate
  form.description = plan.description
  // 加载已有任务到编辑表单
  customTasks.value = plan.tasks.map(t => ({
    title: t.title,
    startDate: t.startDate || t.date,
    endDate: t.endDate || t.date
  }))
  if (customTasks.value.length === 0) {
    customTasks.value = [{ title: '', startDate: '', endDate: '' }]
  }
  showCreateModal.value = true
}

async function deletePlan(plan: Plan) {
  // dataStore.deletePlan 内部已实现级联删除（删除计划 + 同步删除该计划下的全部任务）
  await dataStore.deletePlan(plan.id)
  updatePlans()
  ElMessage.success('删除成功')
}

// 判断任务在计划视图中应显示的勾选状态
// 设计目标：让所有周期任务都能在勾选/取消后立即看到视觉反馈
// - 若今天在任务周期内：按"今天"这一天的勾选状态展示（与 Calendar 行为一致）
// - 若今天不在周期内：按"整个周期是否完全完成"展示，
//   这样用户点击后能立即看到打勾/划线效果
function isTaskCompletedToday(task: Task): boolean {
  const today = formatDate(new Date())

  // 今天在任务周期内：按"今天"的勾选状态展示
  if (isTodayInTaskPeriod(task, today)) {
    return dataStore.isTaskCompletedOnDate(task, today)
  }

  // 今天不在周期内：按整个周期的完成状态展示
  // 这样勾选非今日任务后，UI 也能立即反馈打勾和划线效果
  return dataStore.isTaskFullyCompleted(task)
}

// 判断指定日期是否在任务周期内
function isTodayInTaskPeriod(task: Task, today: string): boolean {
  if (task.startDate && task.endDate) {
    return today >= task.startDate && today <= task.endDate
  }
  // 兼容旧数据：使用 date 字段
  return task.date === today
}

function toggleTask(task: Task, completed: boolean) {
  // 任务列表的勾选/取消勾选作用于整个任务周期
  // 这样日历视图与计划视图的任务状态完全同步
  dataStore.toggleTaskCycle(task.id, completed)
  updatePlans()
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

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.plans-page {
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
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.plan-card {
  padding: 24px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plan-info h3 {
  margin: 0 0 4px;
  font-size: 20px;
}

.plan-info p {
  margin: 0;
  color: var(--text-secondary);
}

.plan-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.progress-bar-container {
  height: 8px;
  background: var(--border-default);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1e40af, #0d9488);
  border-radius: 4px;
  transition: width 0.5s;
}

.plan-tasks h4 {
  margin: 0 0 12px;
  font-size: 16px;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  transition: all var(--transition-fast);
}

.task-item:hover {
  border-color: var(--color-primary);
  background: var(--color-primary-light, rgba(99, 102, 241, 0.05));
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-name {
  text-decoration: line-through;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  font-size: 14px;
}

.task-period {
  font-size: 12px;
  color: var(--text-tertiary);
}

.more-tasks {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-tertiary);
}

.plan-actions {
  display: flex;
  gap: 8px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.plan-detail {
  padding: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-header h3 {
  margin: 0;
  font-size: 20px;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.info-item {
  font-size: 15px;
}

.info-item .label {
  font-weight: 600;
  color: var(--text-secondary);
}

.detail-tasks h4 {
  margin: 0 0 12px;
  font-size: 16px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-surface);
  border-radius: 8px;
}

.task-row.completed {
  opacity: 0.6;
}

.task-row.completed .task-title {
  text-decoration: line-through;
}

.task-title {
  flex: 1;
  font-size: 14px;
}

.task-date {
  font-size: 13px;
  color: var(--text-tertiary);
}

.custom-task-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
</style>