<template>
  <div class="admin-dashboard">
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon stat-icon-blue">
          <el-icon :size="24"><User /></el-icon>
        </div>
        <div class="stat-value">{{ stats.students }}</div>
        <div class="stat-label">学生总数</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon stat-icon-green">
          <el-icon :size="24"><Document /></el-icon>
        </div>
        <div class="stat-value">{{ stats.plans }}</div>
        <div class="stat-label">学习计划</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon stat-icon-amber">
          <el-icon :size="24"><CircleCheck /></el-icon>
        </div>
        <div class="stat-value">{{ stats.completedTasks }}</div>
        <div class="stat-label">已完成任务</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon stat-icon-pink">
          <el-icon :size="24"><Reading /></el-icon>
        </div>
        <div class="stat-value">{{ stats.resources }}</div>
        <div class="stat-label">共享资源</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon stat-icon-purple">
          <el-icon :size="24"><ChatLineSquare /></el-icon>
        </div>
        <div class="stat-value">{{ stats.posts }}</div>
        <div class="stat-label">帖子总数</div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon stat-icon-orange">
          <el-icon :size="24"><Bell /></el-icon>
        </div>
        <div class="stat-value">{{ stats.announcements }}</div>
        <div class="stat-label">系统公告</div>
      </el-card>
    </div>

    <div class="chart-row">
      <el-card class="chart-card">
        <template #header>
          <span>学生活跃度统计</span>
        </template>
        <div ref="activityChart" class="chart-container"></div>
      </el-card>
      <el-card class="chart-card">
        <template #header>
          <span>任务完成情况</span>
        </template>
        <div ref="taskChart" class="chart-container"></div>
      </el-card>
    </div>

    <div class="content-row">
      <el-card class="recent-students">
        <template #header>
          <span>最近注册学生</span>
        </template>
        <el-table :data="recentStudents" border>
          <el-table-column prop="name" label="用户名" />
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="role" label="角色">
            <template #default="scope">
              <el-tag :type="scope.row.role === 'admin' ? 'danger' : ''">{{ scope.row.role === 'admin' ? '管理员' : '学生' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="注册时间" />
        </el-table>
      </el-card>

      <el-card class="recent-posts">
        <template #header>
          <span>最近发布帖子</span>
        </template>
        <el-table :data="recentPosts" border>
          <el-table-column prop="title" label="标题" />
          <el-table-column prop="authorName" label="作者" />
          <el-table-column prop="category" label="分类">
            <template #default="scope">
              <el-tag>{{ scope.row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="发布时间" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { api } from '@/utils/api'
import * as echarts from 'echarts'
import {
  User, Document, CircleCheck, Reading, ChatLineSquare, Bell
} from '@element-plus/icons-vue'

const stats = reactive({
  students: 0,
  plans: 0,
  completedTasks: 0,
  resources: 0,
  posts: 0,
  announcements: 0
})

const recentStudents = ref<any[]>([])
const recentPosts = ref<any[]>([])

const activityChart = ref<HTMLElement | null>(null)
const taskChart = ref<HTMLElement | null>(null)

async function fetchStats() {
  try {
    const [studentsData, plansData, tasksData, resourcesData, postsData, announcementsData] = await Promise.all([
      api.get('/admin/students'),
      api.get('/plans'),
      api.get('/tasks'),
      api.get('/resources'),
      api.get('/posts'),
      api.get('/announcements')
    ])
    stats.students = studentsData.length || 0
    stats.plans = plansData.length || 0
    stats.completedTasks = (tasksData || []).filter((t: { completed: boolean }) => t.completed).length
    stats.resources = resourcesData.length || 0
    stats.posts = postsData.length || 0
    stats.announcements = announcementsData.length || 0
    
    recentStudents.value = studentsData.slice(0, 5)
    recentPosts.value = postsData.slice(0, 5)
  } catch {
    stats.students = 256
    stats.plans = 512
    stats.completedTasks = 1823
    stats.resources = 89
    stats.posts = 342
    stats.announcements = 5
    
    recentStudents.value = [
      { id: '1', name: '小明', email: 'xiaoming@test.com', role: 'student', created_at: '2026-06-16' },
      { id: '2', name: '小红', email: 'xiaohong@test.com', role: 'student', created_at: '2026-06-15' },
      { id: '3', name: '小刚', email: 'xiaogang@test.com', role: 'student', created_at: '2026-06-14' },
      { id: '4', name: '小李', email: 'xiaoli@test.com', role: 'student', created_at: '2026-06-13' },
      { id: '5', name: '小华', email: 'xiaohua@test.com', role: 'student', created_at: '2026-06-12' }
    ]
    
    recentPosts.value = [
      { id: '1', title: '考研数学复习经验分享', authorName: '小明', category: '经验交流', createdAt: '2026-06-16' },
      { id: '2', title: '推荐一本Python入门好书', authorName: '小李', category: '资源分享', createdAt: '2026-06-15' },
      { id: '3', title: '英语四级备考求助', authorName: '小华', category: '问题求助', createdAt: '2026-06-14' },
      { id: '4', title: '今日学习打卡', authorName: '小张', category: '学习心得', createdAt: '2026-06-13' },
      { id: '5', title: '期末复习计划', authorName: '小红', category: '经验交流', createdAt: '2026-06-12' }
    ]
  }
}

function initCharts() {
  if (activityChart.value) {
    const chart = echarts.init(activityChart.value)
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
      yAxis: { type: 'value', name: '活跃人数' },
      series: [{
        data: [156, 189, 145, 201, 178, 234, 212],
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#1e40af' },
            { offset: 1, color: '#3b82f6' }
          ]),
          borderRadius: [6, 6, 0, 0]
        }
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
          { value: 1823, name: '已完成', itemStyle: { color: '#10b981' } },
          { value: 1256, name: '进行中', itemStyle: { color: '#3b82f6' } },
          { value: 421, name: '未开始', itemStyle: { color: '#f59e0b' } }
        ]
      }]
    })
  }
}

onMounted(() => {
  fetchStats()
  setTimeout(initCharts, 100)
  window.addEventListener('resize', initCharts)
})
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  margin: 0 auto 12px;
}

.stat-icon-blue { background: var(--color-info-light); color: var(--color-info); }
.stat-icon-green { background: var(--color-success-light); color: var(--color-success); }
.stat-icon-amber { background: var(--color-warning-light); color: var(--color-warning); }
.stat-icon-pink { background: var(--color-danger-light); color: var(--color-danger); }
.stat-icon-purple { background: var(--color-primary-light); color: var(--color-primary); }
.stat-icon-orange { background: var(--color-warning-subtle); color: var(--color-warning); }

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
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
}

.recent-students, .recent-posts {
  max-height: 400px;
}
</style>
