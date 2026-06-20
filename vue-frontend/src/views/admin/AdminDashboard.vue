<template>
  <div class="admin-dashboard">
    <h2 class="page-title">数据概览</h2>

    <div v-loading="loading" class="dashboard-body">
      <!-- 概览卡片 -->
      <div class="kpi-grid">
        <div v-for="kpi in kpis" :key="kpi.key" class="kpi-card" :style="{ borderColor: kpi.color }">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-value" :style="{ color: kpi.color }">{{ kpi.value }}</div>
          <div class="kpi-sub">{{ kpi.sub }}</div>
        </div>
      </div>

      <!-- 折线图：14 日活跃 -->
      <el-card class="chart-card">
        <template #header>
          <div class="chart-header">
            <span class="chart-title">14 日活跃趋势</span>
            <div class="legend">
              <span class="legend-item"><i style="background:#3b82f6"></i><span>用户</span></span>
              <span class="legend-item"><i style="background:#10b981"></i><span>帖子</span></span>
              <span class="legend-item"><i style="background:#f59e0b"></i><span>资源</span></span>
            </div>
          </div>
        </template>
        <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="line-chart" preserveAspectRatio="none">
          <g v-for="g in gridLines" :key="'g' + g.y">
            <line :x1="padX" :y1="g.y" :x2="chartW - padX" :y2="g.y" :stroke="gridStroke" stroke-dasharray="2 3" />
            <text :x="padX - 6" :y="g.y + 4" font-size="10" :fill="axisLabelFill" text-anchor="end">{{ g.label }}</text>
          </g>
          <g v-for="(d, i) in daily" :key="'x' + i">
            <text :x="xAt(i)" :y="chartH - padX + 16" font-size="10" :fill="axisLabelFill" text-anchor="middle">
              {{ d.date.slice(5) }}
            </text>
          </g>
          <polyline :points="userPath" fill="none" stroke="#3b82f6" stroke-width="2" />
          <polyline :points="postPath" fill="none" stroke="#10b981" stroke-width="2" />
          <polyline :points="resPath" fill="none" stroke="#f59e0b" stroke-width="2" />
          <g v-for="(d, i) in daily" :key="'pt' + i">
            <circle :cx="xAt(i)" :cy="yAt(d.users)" r="3" fill="#3b82f6" />
            <circle :cx="xAt(i)" :cy="yAt(d.posts)" r="3" fill="#10b981" />
            <circle :cx="xAt(i)" :cy="yAt(d.resources)" r="3" fill="#f59e0b" />
          </g>
        </svg>
      </el-card>

      <!-- 双列：饼图 + 资源分类 -->
      <div class="grid-2">
        <el-card>
          <template #header><span class="chart-title">资源分类占比</span></template>
          <div v-if="!categoryChart.length" class="empty">暂无分类数据</div>
          <div v-else class="pie-row">
            <svg :viewBox="`0 0 200 200`" class="pie-chart">
              <g v-for="(seg, i) in pieSegments" :key="i">
                <path :d="seg.path" :fill="seg.color" />
              </g>
              <circle cx="100" cy="100" r="50" :fill="pieCenterFill" />
              <text x="100" y="96" text-anchor="middle" font-size="13" :fill="pieSubFill">总数</text>
              <text x="100" y="118" text-anchor="middle" font-size="22" font-weight="700" :fill="pieValueFill">
                {{ stats.resourceTotal }}
              </text>
            </svg>
            <ul class="pie-legend">
              <li v-for="(c, i) in categoryChart" :key="c.name">
                <i :style="{ background: palette[i % palette.length] }" />
                <span class="pie-name">{{ c.name }}</span>
                <span class="pie-value">{{ c.value }}</span>
              </li>
            </ul>
          </div>
        </el-card>

        <el-card>
          <template #header><span class="chart-title">最近活动</span></template>
          <ul class="activity-list">
            <li v-for="item in activityItems" :key="item.label">
              <el-icon :style="{ color: item.color }"><component :is="item.icon" /></el-icon>
              <span class="act-label">{{ item.label }}</span>
              <span class="act-value">{{ item.value }}</span>
            </li>
          </ul>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '@/utils/api'
import { useThemeStore } from '@/stores/theme'
import { User, ChatDotRound, Files, Star, ChatLineRound, Download } from '@element-plus/icons-vue'

const themeStore = useThemeStore()
const loading = ref(false)
const stats = ref<any>({
  userTotal: 0, userDisabled: 0, newUsers7d: 0, newUsers30d: 0,
  postTotal: 0, postPending: 0, posts7d: 0,
  resourceTotal: 0, resources7d: 0,
  downloadTotal: 0, likeTotal: 0, commentTotal: 0,
  resourceByCategory: [], daily: []
})

const daily = computed(() => stats.value.daily || [])

// 暗黑模式自适应颜色
const gridStroke = computed(() => themeStore.isDark ? '#334155' : '#e5e7eb')
const axisLabelFill = computed(() => themeStore.isDark ? '#94a3b8' : '#9ca3af')
const pieCenterFill = computed(() => themeStore.isDark ? '#1e293b' : '#fff')
const pieSubFill = computed(() => themeStore.isDark ? '#94a3b8' : '#6b7280')
const pieValueFill = computed(() => themeStore.isDark ? '#f1f5f9' : '#111827')

const kpis = computed(() => [
  { key: 'user', label: '注册用户', value: stats.value.userTotal, sub: `禁用 ${stats.value.userDisabled} · 7日新增 ${stats.value.newUsers7d}`, color: '#3b82f6' },
  { key: 'post', label: '帖子总数', value: stats.value.postTotal, sub: `待审核 ${stats.value.postPending} · 7日新增 ${stats.value.posts7d}`, color: '#10b981' },
  { key: 'resource', label: '资源总数', value: stats.value.resourceTotal, sub: `7日新增 ${stats.value.resources7d}`, color: '#f59e0b' },
  { key: 'download', label: '总下载量', value: stats.value.downloadTotal, sub: '累计下载', color: '#8b5cf6' },
  { key: 'like', label: '点赞数', value: stats.value.likeTotal, sub: '帖子互动', color: '#ec4899' },
  { key: 'comment', label: '评论数', value: stats.value.commentTotal, sub: '互动数据', color: '#06b6d4' }
])

const activityItems = computed(() => [
  { label: '7日新增用户', value: stats.value.newUsers7d, icon: User, color: '#3b82f6' },
  { label: '7日新增帖子', value: stats.value.posts7d, icon: ChatDotRound, color: '#10b981' },
  { label: '7日新增资源', value: stats.value.resources7d, icon: Files, color: '#f59e0b' },
  { label: '30日新增用户', value: stats.value.newUsers30d, icon: User, color: '#6366f1' }
])

const categoryChart = computed(() => stats.value.resourceByCategory || [])

const palette = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16']

const chartW = 720
const chartH = 240
const padX = 30
const padY = 24

const maxY = computed(() => {
  const m = Math.max(1, ...daily.value.flatMap(d => [d.users, d.posts, d.resources]))
  return Math.ceil(m / 5) * 5 || 5
})

function xAt(i: number) {
  if (daily.value.length <= 1) return chartW / 2
  return padX + (i * (chartW - padX * 2)) / (daily.value.length - 1)
}
function yAt(v: number) {
  return padY + (1 - v / maxY.value) * (chartH - padY * 2)
}
const gridLines = computed(() => {
  const lines: { y: number; label: string }[] = []
  for (let i = 0; i <= 4; i++) {
    const v = (maxY.value / 4) * i
    lines.push({ y: yAt(v), label: String(Math.round(v)) })
  }
  return lines
})

function buildPath(getter: (d: any) => number) {
  return daily.value.map((d, i) => `${xAt(i)},${yAt(getter(d))}`).join(' ')
}
const userPath = computed(() => buildPath(d => d.users))
const postPath = computed(() => buildPath(d => d.posts))
const resPath = computed(() => buildPath(d => d.resources))

const pieSegments = computed(() => {
  const list = categoryChart.value
  const total = list.reduce((s: number, c: any) => s + c.value, 0) || 1
  let start = -Math.PI / 2
  const cx = 100, cy = 100, r = 80
  return list.map((c: any, i: number) => {
    const angle = (c.value / total) * Math.PI * 2
    const end = start + angle
    const x1 = cx + r * Math.cos(start)
    const y1 = cy + r * Math.sin(start)
    const x2 = cx + r * Math.cos(end)
    const y2 = cy + r * Math.sin(end)
    const large = angle > Math.PI ? 1 : 0
    const path = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
    start = end
    return { path, color: palette[i % palette.length] }
  })
})

async function load() {
  loading.value = true
  try {
    stats.value = await api.get('/admin/stats') as any
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.admin-dashboard { padding: 8px 4px; }
.page-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: var(--el-text-color-primary); }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.kpi-card {
  background: var(--el-bg-color-overlay, #fff);
  border-radius: 10px;
  padding: 16px;
  border-left: 4px solid #3b82f6;
  box-shadow: var(--el-box-shadow-light, 0 1px 3px rgba(0,0,0,0.04));
}
.kpi-label { font-size: 13px; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.kpi-value { font-size: 28px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
.kpi-sub { font-size: 12px; color: var(--el-text-color-placeholder); }

.chart-card { margin-bottom: 16px; }
.chart-header { display: flex; justify-content: space-between; align-items: center; }
.chart-title { color: var(--el-text-color-primary); font-weight: 600; }
.legend { display: flex; gap: 12px; font-size: 12px; color: var(--el-text-color-regular); }
.legend-item { display: inline-flex; align-items: center; gap: 4px; }
.legend-item i { display: inline-block; width: 10px; height: 10px; border-radius: 2px; }
.line-chart { width: 100%; height: 240px; }

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }

.pie-row { display: flex; align-items: center; gap: 16px; }
.pie-chart { width: 180px; height: 180px; flex-shrink: 0; }
.pie-legend { list-style: none; padding: 0; margin: 0; flex: 1; }
.pie-legend li {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; padding: 6px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter, #f3f4f6);
}
.pie-legend li i { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
.pie-name { flex: 1; color: var(--el-text-color-regular); }
.pie-value { font-weight: 600; color: var(--el-text-color-primary); }

.activity-list { list-style: none; padding: 0; margin: 0; }
.activity-list li {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0; border-bottom: 1px solid var(--el-border-color-lighter, #f3f4f6); font-size: 14px;
}
.activity-list li:last-child { border-bottom: 0; }
.act-label { flex: 1; color: var(--el-text-color-regular); }
.act-value { font-weight: 700; color: var(--el-text-color-primary); font-size: 16px; }
.empty { padding: 40px 0; text-align: center; color: var(--el-text-color-placeholder); font-size: 13px; }
</style>
