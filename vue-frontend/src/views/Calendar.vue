<template>
  <div class="calendar-page">
    <div class="calendar-container">
      <el-card>
        <template #header>
          <div class="card-header-flex">
            <span>学习计划日历</span>
            <el-button type="primary" size="small" @click="showAddTaskModal = true">
              <el-icon><Plus /></el-icon>
              <span>添加任务</span>
            </el-button>
          </div>
        </template>
        <div class="calendar-wrapper">
          <div class="calendar-nav">
            <el-button @click="prevMonth">上一月</el-button>
            <span class="current-month">{{ currentYear }}年{{ currentMonth }}月</span>
            <el-button @click="nextMonth">下一月</el-button>
            <el-button @click="goToday">今天</el-button>
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
          <span>{{ selectedDateStr }} 的任务</span>
        </template>
        <div v-if="selectedTasks.length === 0" class="empty-state">
          <el-icon style="font-size: 48px; color: #94a3b8;"><Document /></el-icon>
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
            <el-tag :type="dataStore.isTaskCompletedOnDate(task, selectedDateStr) ? 'success' : ''">
              {{ dataStore.isTaskCompletedOnDate(task, selectedDateStr) ? '已完成' : '待完成' }}
            </el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="showAddTaskModal" title="添加任务" width="500px">
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
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useDataStore } from '@/stores/data'
import { Plus, Document } from '@element-plus/icons-vue'

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
    // 如果任务有 startDate 和 endDate，检查该日期是否在范围内
    if (t.startDate && t.endDate) {
      return selectedDateStr.value >= t.startDate && selectedDateStr.value <= t.endDate
    }
    // 兼容旧数据：使用 date 字段
    return t.date === selectedDateStr.value
  })
})

function getTasksByDate(date: string) {
  return dataStore.tasks.filter(t => {
    // 如果任务有 startDate 和 endDate，检查该日期是否在范围内
    if (t.startDate && t.endDate) {
      return date >= t.startDate && date <= t.endDate
    }
    // 兼容旧数据：使用 date 字段
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
  
  // 将日期转换为 YYYY-MM-DD 格式
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

async function fetchData() {
  await dataStore.fetchAllData()
}

onMounted(() => {
  fetchData()
  goToday()
})
</script>

<style scoped>
.calendar-page {
  padding: 24px;
}

.calendar-container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.calendar-wrapper {
  padding: 16px;
}

.calendar-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.current-month {
  font-size: 18px;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
}

.calendar-grid {
  display: flex;
  flex-direction: column;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 8px;
}

.day-header {
  text-align: center;
  padding: 12px;
  font-weight: 600;
  color: #64748b;
}

.calendar-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  background: #f8fafc;
}

.day-cell:hover {
  background: #e2e8f0;
}

.day-cell.other-month {
  opacity: 0.3;
}

.day-cell.today {
  background: #dbeafe;
}

.day-cell.today .day-number {
  background: #1e40af;
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.day-cell.selected {
  background: #1e40af;
  color: white;
}

.day-cell.has-task {
  background: #fef3c7;
}

.day-number {
  font-size: 14px;
}

.task-indicators {
  display: flex;
  gap: 2px;
  margin-top: 4px;
}

.task-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #1e40af;
}

.task-indicator.completed {
  background: #10b981;
}

.more-tasks {
  font-size: 10px;
  color: #64748b;
}

.tasks-panel {
  height: fit-content;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #94a3b8;
}

.empty-state p {
  margin-top: 12px;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 10px;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-content h4 {
  text-decoration: line-through;
}

.task-content h4 {
  margin: 0;
  font-size: 15px;
}

.task-content p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

@media (max-width: 900px) {
  .calendar-container {
    grid-template-columns: 1fr;
  }
}
</style>
