<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon stat-icon-blue">
            <el-icon :size="24"><FolderOpened /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.plans }}</div>
            <div class="stat-label">学习计划</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon stat-icon-green">
            <el-icon :size="24"><CircleCheck /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.completedTasks }}</div>
            <div class="stat-label">已完成任务</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon stat-icon-amber">
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.progress }}%</div>
            <div class="stat-label">总体进度</div>
          </div>
        </div>
      </el-card>
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-icon stat-icon-pink">
            <el-icon :size="24"><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.reminders }}</div>
            <div class="stat-label">学习提醒</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表行 -->
    <div class="chart-row">
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">学习时长统计</span>
        </template>
        <div ref="studyTimeChart" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span class="card-title">任务完成情况</span>
        </template>
        <div ref="taskChart" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 内容行 -->
    <div class="content-row">
      <el-card class="today-tasks">
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">今日任务</span>
            <el-button type="primary" size="small" @click="goToCalendar">
              <el-icon><Calendar /></el-icon>
              <span>查看日历</span>
            </el-button>
          </div>
        </template>
        <div v-if="todayTasks.length === 0" class="empty-state">
          <el-icon :size="48" color="var(--text-tertiary)"><Document /></el-icon>
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
            <el-tag :type="task.completed ? 'success' : 'info'" size="small">
              {{ task.completed ? '已完成' : '进行中' }}
            </el-tag>
          </div>
        </div>
      </el-card>

      <el-card class="recent-goals">
        <template #header>
          <div class="card-header-flex">
            <span class="card-title">近期目标</span>
            <el-button type="primary" size="small" @click="goToGoals">
              <el-icon><Aim /></el-icon>
              <span>管理目标</span>
            </el-button>
          </div>
        </template>
        <div v-if="recentGoals.length === 0" class="empty-state">
          <el-icon :size="48" color="var(--text-tertiary)"><Aim /></el-icon>
          <p>暂无学习目标</p>
        </div>
        <div v-else class="goal-list">
          <div
            v-for="goal in recentGoals"
            :key="goal.id"
            class="goal-item"
          >
            <div class="goal-header">
              <h4>{{ goal.title }}</h4>
              <el-tag :type="getStatusType(goal.status)" size="small">{{ getStatusText(goal.status) }}</el-tag>
            </div>
            <div class="goal-progress">
              <div class="progress-bar" :style="{ width: goal.progress + '%' }"></div>
            </div>
            <div class="goal-meta">
              <span class="goal-date">{{ goal.targetDate }}</span>
              <span class="goal-percent">{{ goal.progress }}%</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 公告 -->
    <el-card class="announcements">
      <template #header>
        <span class="card-title">系统公告</span>
      </template>
      <div v-if="announcements.length === 0" class="empty-state">
        <el-icon :size="48" color="var(--text-tertiary)"><Bell /></el-icon>
        <p>暂无公告</p>
      </div>
      <div v-else class="announcement-list">
        <div
          v-for="announcement in announcements"
          :key="announcement.id"
          class="announcement-item"
        >
          <el-tag :type="getPriorityType(announcement.priority)" size="small" class="priority-tag">
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
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import * as echarts from 'echarts'
import { useDataStore } from '@/stores/data'
import { useThemeStore } from '@/stores/theme'
import { Document, Aim, Bell, Calendar, FolderOpened, CircleCheck, TrendCharts } from '@element-plus/icons-vue'

const router = useRouter()
const dataStore = useDataStore()
const themeStore = useThemeStore()

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
  stats.reminders = 0
  stats.progress = dataStore.tasks.length > 0
    ? Math.round((stats.completedTasks / dataStore.tasks.length) * 100)
    : 0

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
  const completedCount = dataStore.tasks.filter(t => t.completed).length
  const inProgressCount = dataStore.tasks.filter(t => !t.completed).length

  if (studyTimeChart.value) {
    const chart = echarts.init(studyTimeChart.value)
    const studyData = dataStore.tasks.slice(0, 7).map(t => t.completed ? 60 : 30)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
      yAxis: { type: 'value', name: '分钟' },
      series: [{
        data: studyData.length >= 7 ? studyData : [0, 0, 0, 0, 0, 0, 0],
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(79, 70, 229, 0.3)' },
            { offset: 1, color: 'rgba(79, 70, 229, 0.05)' }
          ])
        },
        lineStyle: { color: '#4f46e5', width: 3 },
        itemStyle: { color: '#4f46e5' }
      }]
    })
  }

  if (taskChart.value) {
    const chart = echarts.init(taskChart.value)
    chart.setOption({
      tooltip: { trigger: 'item' },
      legend: {
        bottom: 0,
        textStyle: { color: themeStore.isDark ? '#e2e8f0' : '#374151', fontSize: 13 }
      },
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
          { value: inProgressCount, name: '进行中', itemStyle: { color: '#4f46e5' } },
          { value: dataStore.tasks.length - completedCount - inProgressCount || 0, name: '未开始', itemStyle: { color: '#f59e0b' } }
        ]
      }]
    })
  }
}

function toggleTask(task: { id: string }, completed: boolean) {
  dataStore.updateTask(task.id, { completed })
}

function getStatusType(status: string) {
  const map: Record<string, string> = { '进行中': '', '已完成': 'success', '已放弃': 'danger' }
  return map[status] || ''
}

function getStatusText(status: string) {
  return status
}

function getPriorityType(priority: string) {
  const map: Record<string, string> = { 'high': 'danger', 'normal': '', 'low': 'success' }
  return map[priority] || ''
}

function getPriorityText(priority: string) {
  const map: Record<string, string> = { 'high': '紧急', 'normal': '普通', 'low': '一般' }
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

watch(() => themeStore.isDark, () => {
  initCharts()
})
</script>

<style scoped>
.dashboard {
  padding: var(--space-6);
}

/* ---- 统计卡片 ---- */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.stat-icon-blue { background: var(--color-info-light); color: var(--color-info); }
.stat-icon-green { background: var(--color-success-light); color: var(--color-success); }
.stat-icon-amber { background: var(--color-warning-light); color: var(--color-warning); }
.stat-icon-pink { background: var(--color-danger-light); color: var(--color-danger); }

.stat-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: var(--leading-tight);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}

/* ---- 图表行 ---- */
.chart-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
}

.chart-card {
  height: 320px;
}

.card-title {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--text-primary);
}

.chart-container {
  width: 100%;
  height: calc(100% - 50px);
}

/* ---- 内容行 ---- */
.content-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: var(--space-6);
  margin-bottom: var(--space-8);
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
  padding: var(--space-10);
  color: var(--text-tertiary);
  gap: var(--space-3);
}

.empty-state p {
  margin-top: var(--space-3);
}

/* ---- 任务列表 ---- */
.task-list {
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
}

.task-item.completed {
  opacity: 0.6;
}

.task-item.completed .task-info h4 {
  text-decoration: line-through;
}

.task-info h4 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 500;
}

.task-info p {
  margin: var(--space-1) 0 0;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* ---- 目标列表 ---- */
.goal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.goal-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-4);
  background: var(--bg-surface-hover);
  border-radius: var(--radius-md);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-header h4 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.goal-progress {
  height: 8px;
  background: var(--border-default);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-info));
  border-radius: var(--radius-full);
  transition: width var(--transition-slow);
}

.goal-meta {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

.goal-percent {
  font-weight: 600;
  color: var(--color-primary);
}

/* ---- 公告 ---- */
.announcement-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.announcement-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-surface-hover);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.announcement-item:hover {
  background: var(--color-primary-light);
}

.priority-tag {
  flex-shrink: 0;
}

.announcement-content h4 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.announcement-content p {
  margin: var(--space-1) 0 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.announcement-time {
  margin-left: auto;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
}

/* ---- 响应式 ---- */
@media (max-width: 768px) {
  .dashboard {
    padding: var(--space-4);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-3);
  }

  .stat-value {
    font-size: var(--text-2xl);
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .chart-row,
  .content-row {
    grid-template-columns: 1fr;
  }

  .chart-card {
    height: 280px;
  }

  .announcement-item {
    flex-direction: column;
  }

  .announcement-time {
    margin-left: 0;
  }
}
</style>
