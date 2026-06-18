<template>
  <div class="dashboard">
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #dbeafe;">📋</div>
        <div class="stat-value">{{ stats.plans }}</div>
        <div class="stat-label">学习计划</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #d1fae5;">✅</div>
        <div class="stat-value">{{ stats.completedTasks }}</div>
        <div class="stat-label">已完成任务</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #fef3c7;">📅</div>
        <div class="stat-value">{{ stats.progress }}%</div>
        <div class="stat-label">总体进度</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #fce7f3;">🔔</div>
        <div class="stat-value">{{ stats.reminders }}</div>
        <div class="stat-label">学习提醒</div>
      </el-card>
    </div>

    <div class="chart-row">
      <el-card class="chart-card">
        <template #header>
          <span>学习时长统计</span>
        </template>
        <div ref="studyTimeChart" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>任务完成情况</span>
        </template>
        <div ref="taskChart" class="chart-container"></div>
      </el-card>
    </div>

    <div class="content-row">
      <el-card class="today-tasks">
        <template #header>
          <div class="card-header-flex">
            <span>今日任务</span>
            <el-button type="primary" size="small" @click="goToCalendar">查看日历</el-button>
          </div>
        </template>
        <div v-if="todayTasks.length === 0" class="empty-state">
          <el-icon style="font-size: 48px; color: #94a3b8;"><Document /></el-icon>
          <p>今日暂无任务</p>
        </div>
        <div v-else class="task-list">
          <div
            v-for="task in todayTasks"
            :key="task.id"
            class="task-item"
            :class="{ completed: task.completed }"
          >
            <el-checkbox :checked="task.completed" @change="(val) => toggleTask(task, val)" />
            <div class="task-info">
              <h4>{{ task.title }}</h4>
              <p>{{ task.planTitle }}</p>
            </div>
            <el-tag>{{ task.completed ? '已完成' : '进行中' }}</el-tag>
          </div>
        </div>
      </el-card>

      <el-card class="recent-goals">
        <template #header>
          <div class="card-header-flex">
            <span>近期目标</span>
            <el-button type="primary" size="small" @click="goToGoals">管理目标</el-button>
          </div>
        </template>
        <div v-if="recentGoals.length === 0" class="empty-state">
          <el-icon style="font-size: 48px; color: #94a3b8;"><Aim /></el-icon>
          <p>暂无学习目标</p>
        </div>
        <div v-else class="goal-list">
          <div
            v-for="goal in recentGoals"
            :key="goal.id"
            class="goal-item"
          >
            <div class="goal-progress">
              <div class="progress-bar" :style="{ width: goal.progress + '%' }"></div>
            </div>
            <div class="goal-info">
              <h4>{{ goal.title }}</h4>
              <p>{{ goal.targetDate }}</p>
            </div>
            <el-tag :type="getStatusType(goal.status)">{{ getStatusText(goal.status) }}</el-tag>
          </div>
        </div>
      </el-card>
    </div>

    <el-card class="announcements">
      <template #header>
        <span>系统公告</span>
      </template>
      <div v-if="announcements.length === 0" class="empty-state">
        <el-icon style="font-size: 48px; color: #94a3b8;"><Bell /></el-icon>
        <p>暂无公告</p>
      </div>
      <div v-else class="announcement-list">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement-item"
        >
          <el-tag :type="getPriorityType(announcement.priority)" class="priority-tag">
            {{ getPriorityText(announcement.priority) }}
          </el-tag>
          <div class="announcement-content">
            <h4>{{ announcement.title }}</h4>
            <p>{{ announcement.content }}</p>
          </div>
          <span class="announcement-time">{{ announcement.createdAt }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import * as echarts from 'echarts'
import { useDataStore } from '@/stores/data'
import { Document, Aim, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const dataStore = useDataStore()

const stats = reactive({
  plans: 0,
  completedTasks: 0,
  progress: 0,
  reminders: 0
})

const announcements = ref<AnnouncementItem[]>([])

const studyTimeChart = ref<HTMLElement | null>(null)
const taskChart = ref<HTMLElement | null>(null)

const todayTasks = computed(() => dataStore.todayTasks)
const recentGoals = computed(() => dataStore.goals.slice(0, 3))

interface AnnouncementItem {
  id: string
  title: string
  content: string
  priority: string
  createdAt: string
}

async function fetchData() {
  await dataStore.fetchAllData()
  
  stats.plans = dataStore.plans.length
  stats.completedTasks = dataStore.tasks.filter(t => t.completed).length
  stats.reminders = 2
  stats.progress = dataStore.tasks.length > 0 
    ? Math.round((stats.completedTasks / dataStore.tasks.length) * 100) 
    : 0
  
  // 公告数据：优先从后端获取，失败时使用默认数据
  const defaultAnnouncements = [
    { id: '1', title: '系统更新通知', content: '系统将于本周六进行维护升级，届时将暂停服务2小时。', priority: 'high', createdAt: '2026-06-15' },
    { id: '2', title: '新功能上线', content: '日历视图功能已上线，可在首页查看今日任务安排。', priority: 'normal', createdAt: '2026-06-14' },
    { id: '3', title: '学习提醒', content: '请及时完成本周学习任务，保持学习进度。', priority: 'normal', createdAt: '2026-06-13' }
  ]
  
  try {
    const announcementsData = await api.get('/announcements')
    announcements.value = (announcementsData && Array.isArray(announcementsData) && announcementsData.length > 0)
      ? announcementsData.slice(0, 3)
      : defaultAnnouncements
  } catch {
    announcements.value = defaultAnnouncements
  }
}

function initCharts() {
  // 计算真实数据
  const completedCount = dataStore.tasks.filter(t => t.completed).length
  const inProgressCount = dataStore.tasks.filter(t => !t.completed).length
  
  if (studyTimeChart.value) {
    const chart = echarts.init(studyTimeChart.value)
    // 根据任务数量模拟学习时长
    const studyData = dataStore.tasks.slice(0, 7).map(t => t.completed ? 60 : 30)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
      yAxis: { type: 'value', name: '分钟' },
      series: [{
        data: studyData.length >= 7 ? studyData : [120, 180, 90, 240, 150, 300, 280],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(30, 64, 175, 0.3)' },
            { offset: 1, color: 'rgba(30, 64, 175, 0.05)' }
          ])
        },
        lineStyle: { color: '#1e40af', width: 3 }
      }]
    })
  }
  
  if (taskChart.value) {
    const chart = echarts.init(taskChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: 24, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: [
          { value: completedCount, name: '已完成', itemStyle: { color: '#10b981' } },
          { value: inProgressCount, name: '进行中', itemStyle: { color: '#3b82f6' } },
          { value: Math.max(1, dataStore.tasks.length - completedCount - inProgressCount), name: '未开始', itemStyle: { color: '#f59e0b' } }
        ]
      }]
    })
  }
}

function toggleTask(task: { id: string }, completed: boolean) {
  dataStore.updateTask(task.id, { completed })
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    '进行中': '',
    '已完成': 'success',
    '已放弃': 'danger'
  }
  return map[status] || ''
}

function getStatusText(status: string) {
  return status
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = {
    'high': 'danger',
    'normal': '',
    'low': 'success'
  }
  return map[priority] || ''
}

function getPriorityText(priority: string) {
  const map: Record<string, string> = {
    'high': '紧急',
    'normal': '普通',
    'low': '一般'
  }
  return map[priority] || '普通'
}

function goToCalendar() {
  router.push('/calendar')
}

function goToGoals() {
  router.push('/goals')
}

onMounted(() => {
  fetchData()
  setTimeout(initCharts, 100)
  window.addEventListener('resize', initCharts)
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  padding: 24px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin: 0 auto 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
  margin-top: 4px;
}

.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.chart-card {
  height: 300px;
}

.chart-container {
  width: 100%;
  height: calc(100% - 50px);
}

.content-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
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

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-info h4 {
  text-decoration: line-through;
}

.task-info h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.task-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.goal-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-progress {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1e40af, #0d9488);
  border-radius: 4px;
  transition: width 0.5s;
}

.goal-info h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.goal-info p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.announcement-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.announcement-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 10px;
}

.priority-tag {
  flex-shrink: 0;
}

.announcement-content h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.announcement-content p {
  margin: 4px 0 0;
  font-size: 13px;
  color: #64748b;
}

.announcement-time {
  margin-left: auto;
  font-size: 12px;
  color: #94a3b8;
}
</style>
