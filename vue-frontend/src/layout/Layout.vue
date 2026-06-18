<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>🎓 学习计划助手</h1>
      </div>
      <el-menu
        :default-active="activeMenu"
        mode="vertical"
        background-color="transparent"
        text-color="rgba(255,255,255,0.8)"
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
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
        <template v-if="authStore.isAdmin">
          <el-menu-divider style="background-color: rgba(255,255,255,0.2)"></el-menu-divider>
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
            <el-icon><User /></el-icon>
          </div>
          <div class="user-detail">
            <p>{{ authStore.user?.name }}</p>
            <p class="role">{{ authStore.user?.role === 'admin' ? '管理员' : '学生' }}</p>
          </div>
        </div>
        <el-button @click="handleLogout" style="width: 100%; margin-top: 12px;">
          <el-icon><Switch /></el-icon>
          <span>退出登录</span>
        </el-button>
      </div>
    </aside>
    <main class="main-content">
      <header class="main-header">
        <div class="header-content">
          <h2>{{ pageTitle }}</h2>
          <div class="header-actions">
            <el-badge :value="notificationCount" class="notification-badge" :hidden="notificationCount === 0">
              <el-button class="notification-btn" @click="showNotifications = true">
                <el-icon><Bell /></el-icon>
              </el-button>
            </el-badge>
          </div>
        </div>
      </header>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <!-- 消息中心弹窗 -->
    <el-dialog v-model="showNotifications" title="消息中心" width="500px">
      <div v-if="notifications.length === 0" class="empty-notifications">
        <el-icon style="font-size: 48px; color: #94a3b8;"><Bell /></el-icon>
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
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  Monitor,
  Aim,
  FolderOpened,
  Calendar,
  Document,
  ChatLineSquare,
  User,
  Setting,
  DataAnalysis,
  Bell,
  Switch
} from '@element-plus/icons-vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const showNotifications = ref(false)
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
  '/profile': '个人中心',
  '/admin': '数据统计',
  '/admin/students': '学生管理',
  '/admin/plans': '计划管理',
  '/admin/resources': '资源管理',
  '/admin/posts': '帖子管理',
  '/admin/announcements': '公告管理'
}

const pageTitle = computed(() => pageTitleMap[route.path] || '学习计划助手')

function handleMenuSelect(index: string) {
  router.push(index)
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function clearNotifications() {
  notifications.value = []
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
}

.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  padding: 24px;
  flex-shrink: 0;
}

.sidebar-header h1 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 32px;
}

.sidebar-footer {
  margin-top: auto;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-detail p {
  margin: 0;
  font-size: 14px;
}

.user-detail .role {
  font-size: 12px;
  opacity: 0.7;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.main-header {
  background: white;
  padding: 20px 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.notification-btn {
  border: none;
  background: #f1f5f9;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.empty-notifications {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #94a3b8;
}

.empty-notifications p {
  margin-top: 12px;
}

.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notification-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}

.notification-content h4 {
  margin: 0;
  font-size: 15px;
}

.notification-content p {
  margin: 8px 0;
  font-size: 14px;
  color: #64748b;
}

.notification-time {
  font-size: 12px;
  color: #94a3b8;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
