<template>
  <div class="calendar-page">
    <div class="calendar-container">
      <el-card class="calendar-card">
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">学习计划日历</span>
            <el-button type="primary" size="small" @click="showAddTaskModal = true">
              <el-icon><Plus /></el-icon>
              <span>添加任务</span>
            </el-button>
          </div>
        </template>
        <div class="calendar-wrapper">
          <div class="calendar-nav">
            <el-button :icon="ArrowLeft" circle @click="prevMonth" aria-label="上一月" />
            <span class="current-month">{{ currentYear }}年{{ currentMonth }}月</span>
            <el-button :icon="ArrowRight" circle @click="nextMonth" aria-label="下一月" />
            <el-button size="small" @click="goToday">今天</el-button>
          </div>
          <div class="calendar-grid">
            <div class="calendar-header">
              <div v-for="day in weekDays" :key="day" class="day-header">{{ day }}</div>
            </div>
            <div class="calendar-body">
              <div
                v-for="(day, index) in calendarDays"
                :key="index"
                class="day-cell"
                :class="{
                  'other-month': !day.isCurrentMonth,
                  'today': day.isToday,
                  'selected': isSelected(day),
                  'has-task': day.tasks.length > 0
                }"
                @click="selectDate(day)"
              >
                <span class="day-number">{{ day.date }}</span>
                <div v-if="day.tasks.length > 0" class="task-indicators">
                  <div
                    v-for="(task, i) in day.tasks.slice(0, 3)"
                    :key="i"
                    class="task-indicator"
                    :class="{ completed: dataStore.isTaskCompletedOnDate(task, day.fullDate) }"
                  ></div>
                  <span v-if="day.tasks.length > 3" class="more-tasks">{{ day.tasks.length - 3 }}+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="tasks-panel">
        <template #header>
          <span class="card-title">{{ selectedDateStr }} 的任务</span>
        </template>
        <div v-if="selectedTasks.length === 0" class="empty-state">
          <el-icon :size="48" color="var(--text-tertiary)"><Document /></el-icon>
          <p>当日暂无任务</p>
        </div>
        <div v-else class="tasks-list">
          <div
            v-for="task in selectedTasks"
            :key="task.id"
            class="task-item"
            :class="{ completed: dataStore.isTaskCompletedOnDate(task, selectedDateStr) }"
          >
            <el-checkbox :checked="dataStore.isTaskCompletedOnDate(task, selectedDateStr)" @change="(val) => toggleTask(task, val)" />
            <div class="task-content">
              <h4>{{ task.title }}</h4>
              <p>{{ task.planTitle }}</p>
            </div>
            <el-tag :type="dataStore.isTaskCompletedOnDate(task, selectedDateStr) ? 'success' : 'info'" size="small">
              {{ dataStore.isTaskCompletedOnDate(task, selectedDateStr) ? '已完成' : '待完成' }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showAddTaskModal" title="添加任务" width="500px" :class="{ 'dialog-mobile': isMobile }">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="任务名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="所属计划" prop="plan">
          <el-select v-model="form.plan" placeholder="请选择所属计划">
            <el-option v-for="p in dataStore.plans" :key="p.id" :label="p.title" :value="p.title" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务日期" prop="date">
          <el-date-picker v-model="form.date" type="date" :value="selectedDateStr" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddTaskModal = false">取消</el-button>
        <el-button type="primary" @click="handleAddTask">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useDataStore } from '@/stores/data'
import { Plus, Document, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'

const dataStore = useDataStore()

interface CalendarDay {
  date: number
  fullDate: string
  isCurrentMonth: boolean
  isToday: boolean
  tasks: typeof dataStore.tasks[0][]
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六']
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth() + 1)
const selectedDate = ref<CalendarDay | null>(null)
const showAddTaskModal = ref(false)
const formRef = ref()
const isMobile = ref(false)

const form = reactive({
  title: '',
  plan: '',
  date: ''
})

const rules = {
  title: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  plan: [{ required: true, message: '请选择所属计划', trigger: 'blur' }],
  date: [{ required: true, message: '请选择任务日期', trigger: 'blur' }]
}

const calendarDays = computed<CalendarDay[]>(() => {
  const days: CalendarDay[] = []
  const firstDay = new Date(currentYear.value, currentMonth.value - 1, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value, 0)
  const startDay = firstDay.getDay()

  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value - 1, 0).getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i
    const month = currentMonth.value - 1 === 0 ? 12 : currentMonth.value - 1
    const year = currentMonth.value - 1 === 0 ? currentYear.value - 1 : currentYear.value
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`
    days.push({
      date,
      fullDate,
      isCurrentMonth: false,
      isToday: false,
      tasks: getTasksByDate(fullDate)
    })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const fullDate = `${currentYear.value}-${String(currentMonth.value).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({
      date: i,
      fullDate,
      isCurrentMonth: true,
      isToday: isToday(currentYear.value, currentMonth.value, i),
      tasks: getTasksByDate(fullDate)
    })
  }

  const remainingDays = 42 - days.length
  for (let i = 1; i <= remainingDays; i++) {
    const month = currentMonth.value + 1 > 12 ? 1 : currentMonth.value + 1
    const year = currentMonth.value + 1 > 12 ? currentYear.value + 1 : currentYear.value
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
    days.push({
      date: i,
      fullDate,
      isCurrentMonth: false,
      isToday: false,
      tasks: getTasksByDate(fullDate)
    })
  }

  return days
})

const selectedDateStr = computed(() => {
  if (selectedDate.value) {
    return selectedDate.value.fullDate
  }
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return todayStr
})

const selectedTasks = computed(() => {
  return dataStore.tasks.filter(t => {
    if (t.startDate && t.endDate) {
      return selectedDateStr.value >= t.startDate && selectedDateStr.value <= t.endDate
    }
    return t.date === selectedDateStr.value
  })
})

function getTasksByDate(date: string) {
  return dataStore.tasks.filter(t => {
    if (t.startDate && t.endDate) {
      return date >= t.startDate && date <= t.endDate
    }
    return t.date === date
  })
}

function isToday(year: number, month: number, date: number) {
  return today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === date
}

function isSelected(day: CalendarDay) {
  return selectedDate.value?.fullDate === day.fullDate
}

function selectDate(day: CalendarDay) {
  selectedDate.value = day
}

function prevMonth() {
  if (currentMonth.value === 1) {
    currentMonth.value = 12
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 12) {
    currentMonth.value = 1
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToday() {
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth() + 1
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  selectedDate.value = calendarDays.value.find(d => d.fullDate === todayStr) || null
}

async function handleAddTask() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})

  let dateStr = selectedDateStr.value
  if (form.date) {
    const d = new Date(form.date)
    dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  try {
    await dataStore.addTask({
      title: form.title,
      planTitle: form.plan,
      date: dateStr
    })
    ElMessage.success('添加成功')
    showAddTaskModal.value = false
    form.title = ''
    form.plan = ''
    form.date = ''
  } catch {
    ElMessage.error('操作失败')
  }
}

function toggleTask(task: typeof dataStore.tasks[0], completed: boolean) {
  dataStore.toggleTaskOnDate(task.id, selectedDateStr.value, completed)
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

async function fetchData() {
  await dataStore.fetchAllData()
}

onMounted(() => {
  fetchData()
  goToday()
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.calendar-page {
  padding: var(--space-6);
}

.calendar-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: var(--space-6);
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.calendar-wrapper {
  padding: var(--space-4);
}

.calendar-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.current-month {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  min-width: 140px;
  text-align: center;
  letter-spacing: -0.01em;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
  margin-bottom: var(--space-2);
}

.day-header {
  text-align: center;
  padding: var(--space-3);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: var(--space-1);
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  background: var(--bg-surface-hover);
  transition: all var(--transition-fast);
}

.day-cell:hover {
  background: var(--color-primary-light);
  transform: translateY(-1px);
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.today {
  background: var(--color-info-light);
}

.day-cell.today .day-number {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
}

.day-cell.selected {
  background: var(--color-primary);
  color: white;
  box-shadow: var(--shadow-md);
}

.day-cell.selected .day-number {
  color: white;
}

.day-cell.has-task {
  background: var(--color-warning-light);
}

.day-cell.has-task.selected {
  background: var(--color-primary);
}

.day-number {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.task-indicators {
  display: flex;
  gap: 2px;
  margin-top: var(--space-1);
  align-items: center;
}

.task-indicator {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  transition: background var(--transition-fast);
}

.task-indicator.completed {
  background: var(--color-success);
}

.more-tasks {
  font-size: 10px;
  color: var(--text-tertiary);
  margin-left: 2px;
}

.tasks-panel {
  height: fit-content;
  position: sticky;
  top: 80px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-10);
  color: var(--text-tertiary);
  gap: var(--space-3);
}

.empty-state p {
  margin-top: var(--space-3);
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.task-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-surface-hover);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
}

.task-item:hover {
  background: var(--color-primary-light);
  transform: translateX(2px);
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-content h4 {
  text-decoration: line-through;
}

.task-content h4 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

.task-content p {
  margin: var(--space-1) 0 0;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* ---- 响应式 ---- */
@media (max-width: 1024px) {
  .calendar-container {
    grid-template-columns: 1fr;
  }

  .tasks-panel {
    position: static;
  }
}

@media (max-width: 768px) {
  .calendar-page {
    padding: var(--space-4);
  }

  .calendar-wrapper {
    padding: var(--space-2);
  }

  .calendar-nav {
    gap: var(--space-2);
    margin-bottom: var(--space-4);
  }

  .current-month {
    font-size: var(--text-base);
    min-width: 100px;
  }

  .day-header {
    padding: var(--space-2);
    font-size: var(--text-xs);
  }

  .day-cell {
    padding: var(--space-1);
  }

  .day-number {
    font-size: var(--text-xs);
  }

  .task-indicator {
    width: 4px;
    height: 4px;
  }

  .dialog-mobile {
    width: 90% !important;
    margin: 0 auto !important;
  }
}
</style>
