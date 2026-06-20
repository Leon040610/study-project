<template>
  <div class="app-layout" :class="{ 'sidebar-collapsed': isMobile }">
    <!-- 移动端遮罩 -->
    <transition name="fade">
      <div v-if="isMobile && sidebarOpen" class="sidebar-overlay" @click="sidebarOpen = false"></div>
    </transition>

    <aside class="sidebar" :class="{ 'sidebar-open': isMobile && sidebarOpen }">
      <div class="sidebar-header">
        <div class="logo-icon">
          <el-icon :size="24"><Reading /></el-icon>
        </div>
        <span class="logo-text">学习计划助手</span>
        <el-button v-if="isMobile" class="sidebar-close" :icon="Close" circle size="small" @click="sidebarOpen = false" />
      </div>
      <el-menu
          router
          :default-active="activeMenu"
          mode="vertical"
          background-color="transparent"
          text-color="rgba(255,255,255,0.7)"
          active-text-color="#fff"
          @select="handleMenuSelect"
        >
        <el-menu-item index="/dashboard">
          <el-icon><Monitor /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/goals">
          <el-icon><Aim /></el-icon>
          <span>学习目标</span>
        </el-menu-item>
        <el-menu-item index="/plans">
          <el-icon><FolderOpened /></el-icon>
          <span>学习计划</span>
        </el-menu-item>
        <el-menu-item index="/calendar">
          <el-icon><Calendar /></el-icon>
          <span>日历视图</span>
        </el-menu-item>
        <el-menu-item index="/resources">
          <el-icon><Document /></el-icon>
          <span>共享资源</span>
        </el-menu-item>
        <el-menu-item index="/posts">
          <el-icon><ChatLineSquare /></el-icon>
          <span>帖子中心</span>
        </el-menu-item>
        <el-menu-item index="/reminders">
          <el-icon><Bell /></el-icon>
          <span>学习提醒</span>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <template v-if="authStore.isAdmin">
          <el-menu-divider style="background-color: rgba(255,255,255,0.15)"></el-menu-divider>
          <el-sub-menu index="/admin">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>管理控制台</span>
            </template>
            <el-menu-item index="/admin">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据统计</span>
            </el-menu-item>
            <el-menu-item index="/admin/students">
              <el-icon><User /></el-icon>
              <span>学生管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/plans">
              <el-icon><FolderOpened /></el-icon>
              <span>计划管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/resources">
              <el-icon><Document /></el-icon>
              <span>资源管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/posts">
              <el-icon><ChatLineSquare /></el-icon>
              <span>帖子管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/announcements">
              <el-icon><Bell /></el-icon>
              <span>公告管理</span>
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="avatar">
            <el-icon :size="20"><User /></el-icon>
          </div>
          <div class="user-detail">
            <p class="user-name">{{ authStore.user?.name || '用户' }}</p>
            <p class="user-role">{{ authStore.user?.role === 'admin' ? '管理员' : '学生' }}</p>
          </div>
        </div>
        <el-button @click="handleLogout" class="logout-btn">
          <el-icon><Switch /></el-icon>
          <span>退出登录</span>
        </el-button>
      </div>
    </aside>

    <main class="main-content">
      <header class="main-header">
        <div class="header-content">
          <div class="header-left">
            <el-button v-if="isMobile" class="menu-toggle" :icon="Menu" circle @click="sidebarOpen = true" />
            <h2>{{ pageTitle }}</h2>
          </div>
          <div class="header-actions">
            <el-button class="theme-toggle-btn" @click="themeStore.toggle()" aria-label="切换主题">
              <el-icon :size="18">
                <Sunny v-if="themeStore.isDark" />
                <Moon v-else />
              </el-icon>
            </el-button>
            <el-badge :value="notificationCount" class="notification-badge" :hidden="notificationCount === 0">
              <el-button class="notification-btn" @click="showNotifications = true" aria-label="消息中心">
                <el-icon :size="20"><Bell /></el-icon>
              </el-button>
            </el-badge>
          </div>
        </div>
      </header>
      <div class="main-body">
        <router-view :key="route.fullPath" />
      </div>
    </main>

    <!-- 消息中心弹窗 -->
    <el-dialog v-model="showNotifications" title="消息中心" width="500px" :class="{ 'dialog-mobile': isMobile }">
      <div v-if="notifications.length === 0" class="empty-notifications">
        <el-icon :size="48" color="var(--text-tertiary)"><Bell /></el-icon>
        <p>暂无消息</p>
      </div>
      <div v-else class="notifications-list">
        <div v-for="notification in notifications" :key="notification.id" class="notification-item">
          <el-tag :type="notification.type === 'reminder' ? 'warning' : 'info'" size="small">
            {{ notification.type === 'reminder' ? '提醒' : '通知' }}
          </el-tag>
          <div class="notification-content">
            <h4>{{ notification.title }}</h4>
            <p>{{ notification.content }}</p>
            <span class="notification-time">{{ notification.time }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="clearNotifications" type="danger">清空消息</el-button>
        <el-button @click="showNotifications = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import {
  Monitor, Aim, FolderOpened, Calendar, Document, ChatLineSquare,
  User, Setting, DataAnalysis, Bell, Switch, Reading, Close, Menu,
  Sunny, Moon
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()
const route = useRoute()

const showNotifications = ref(false)
const isMobile = ref(false)
const sidebarOpen = ref(false)

const notifications = ref([
  { id: '1', type: 'reminder', title: '学习提醒', content: '今日有3个任务待完成，请及时处理', time: '10分钟前' },
  { id: '2', type: 'notice', title: '系统通知', content: '您的学习计划"考研数学复习"进度已达到65%', time: '1小时前' },
  { id: '3', type: 'reminder', title: '任务提醒', content: '任务"复习Python基础语法"即将到期', time: '2小时前' }
])

const notificationCount = computed(() => notifications.value.length)
const activeMenu = computed(() => route.path)

const pageTitleMap: Record<string, string> = {
  '/dashboard': '首页',
  '/goals': '学习目标',
  '/plans': '学习计划',
  '/calendar': '日历视图',
  '/resources': '共享资源',
  '/posts': '帖子中心',
  '/reminders': '学习提醒',
  '/profile': '个人中心',
  '/admin': '数据统计',
  '/admin/students': '学生管理',
  '/admin/plans': '计划管理',
  '/admin/resources': '资源管理',
  '/admin/posts': '帖子管理',
  '/admin/announcements': '公告管理'
}

const pageTitle = computed(() => pageTitleMap[route.path] || '学习计划助手')

// 调试：监听路由变化
watch(
  () => route.fullPath,
  (newPath, oldPath) => {
    console.log('[Layout] Route changed:', oldPath, '→', newPath)
    console.log('[Layout] route.name:', route.name)
    console.log('[Layout] route.matched:', route.matched.map(m => m.path))
  },
  { immediate: true }
)

function handleMenuSelect(index: string) {
  console.log('[Layout] handleMenuSelect called with index:', index)
  console.log('[Layout] current route.path:', route.path)
  // router 属性已启用，导航由 el-menu 内置的 router-link 处理
  if (isMobile.value) sidebarOpen.value = false
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function clearNotifications() {
  notifications.value = []
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-base);
}

/* ---- 侧边栏 ---- */
.sidebar {
  width: var(--sidebar-width);
  background: var(--gradient-sidebar);
  color: white;
  display: flex;
  flex-direction: column;
  padding: var(--space-6);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: var(--z-fixed);
  transition: transform var(--transition-slow);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-8);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-text {
  font-size: var(--text-lg);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sidebar-close {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.1) !important;
  border: none !important;
  color: white !important;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: var(--space-6);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-full);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.user-name {
  font-size: var(--text-sm);
  font-weight: 600;
  margin: 0;
}

.user-role {
  font-size: var(--text-xs);
  opacity: 0.6;
  margin: 0;
}

.logout-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  transition: all var(--transition-fast) !important;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.3) !important;
  border-color: rgba(239, 68, 68, 0.4) !important;
}

/* ---- 主内容区 ---- */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.main-header {
  background: var(--bg-surface);
  padding: var(--space-5) var(--space-8);
  box-shadow: var(--shadow-xs);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-content h2 {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.menu-toggle {
  background: var(--bg-surface-hover) !important;
  border: none !important;
}

.notification-btn {
  border: none !important;
  background: var(--bg-surface-hover) !important;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast) !important;
}

.notification-btn:hover {
  background: var(--color-primary-light) !important;
  color: var(--color-primary) !important;
}

.theme-toggle-btn {
  border: none !important;
  background: var(--bg-surface-hover) !important;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full) !important;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-spring) !important;
  margin-right: var(--space-2);
}

.theme-toggle-btn:hover {
  background: var(--color-warning-light) !important;
  color: var(--color-warning) !important;
  transform: rotate(15deg);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.main-body {
  flex: 1;
  overflow-y: auto;
}

.route-wrapper {
  min-height: 100%;
  width: 100%;
  position: relative;
}

/* ---- 消息中心 ---- */
.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-10);
  color: var(--text-tertiary);
  gap: var(--space-3);
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.notification-item {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--bg-surface-hover);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.notification-item:hover {
  background: var(--color-primary-light);
}

.notification-content h4 {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
}

.notification-content p {
  margin: var(--space-2) 0;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.notification-time {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}

/* ---- 移动端遮罩 ---- */
.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: calc(var(--z-fixed) - 1);
  backdrop-filter: blur(2px);
}

/* ---- 移动端响应式 ---- */
@media (max-width: 767px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    transform: translateX(-100%);
    box-shadow: var(--shadow-xl);
  }

  .sidebar-open {
    transform: translateX(0);
  }

  .main-header {
    padding: var(--space-4) var(--space-4);
  }

  .header-content h2 {
    font-size: var(--text-lg);
  }

  .dialog-mobile {
    width: 90% !important;
    margin: 0 auto !important;
  }
}

/* ---- 过渡动画 ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-base);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 旧页面淡出时使用绝对定位，避免新页面布局被挤压 */
.fade-leave-active {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}
</style>
