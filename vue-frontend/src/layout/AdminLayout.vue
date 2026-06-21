<template>
  <div class="admin-layout">
    <aside class="admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <el-icon :size="22"><Setting /></el-icon>
          <transition name="fade">
            <span v-if="!sidebarCollapsed" class="logo-text">管理控制台</span>
          </transition>
        </div>
        <el-button class="collapse-btn" :icon="sidebarCollapsed ? Expand : Fold" text circle size="small"
          @click="sidebarCollapsed = !sidebarCollapsed" />
      </div>
      <el-menu :default-active="activeMenu" router class="admin-menu" @select="onSelect">
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>
            <span>{{ item.title }}</span>
            <el-badge v-if="item.badge" :value="item.badge" class="menu-badge" :max="99" />
          </template>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer">
        <el-button :icon="Back" text @click="goBack" class="back-btn">
          <span v-if="!sidebarCollapsed">返回前台</span>
        </el-button>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/admin' }">控制台</el-breadcrumb-item>
            <el-breadcrumb-item v-for="crumb in breadcrumbs" :key="crumb.path">
              {{ crumb.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag v-if="user" type="warning" effect="plain" round class="role-tag">
            <el-icon><Avatar /></el-icon>
            <span>{{ user.name || user.email }}</span>
            <el-divider direction="vertical" />
            <span>管理员</span>
          </el-tag>
          <el-tooltip content="刷新" placement="bottom">
            <el-button :icon="Refresh" text circle @click="reload" />
          </el-tooltip>
          <el-tooltip content="登出" placement="bottom">
            <el-button :icon="SwitchButton" text circle @click="logout" />
          </el-tooltip>
        </div>
      </header>
      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="fade-page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting, Expand, Fold, Back, Refresh, SwitchButton, Avatar,
  Odometer, Files, ChatDotRound, User, Document, DataAnalysis,
  Histogram, Key
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sidebarCollapsed = ref(false)
const user = computed(() => authStore.user)

const menus = [
  { path: '/admin', title: '数据概览', icon: Odometer },
  { path: '/admin/resources', title: '资源管理', icon: Files },
  { path: '/admin/posts', title: '帖子管理', icon: ChatDotRound },
  { path: '/admin/students', title: '用户管理', icon: User },
  { path: '/admin/logs', title: '系统日志', icon: Document },
  { path: '/admin/settings', title: '系统设置', icon: Key }
]

const activeMenu = computed(() => {
  if (route.path === '/admin') return '/admin'
  // 精确匹配优先
  const exact = menus.find(m => m.path === route.path)
  if (exact) return exact.path
  // 父级回退
  const parent = menus.find(m => m.path !== '/admin' && route.path.startsWith(m.path))
  return parent ? parent.path : route.path
})

const breadcrumbs = computed(() => {
  const item = menus.find(m => m.path === route.path)
  return item && item.path !== '/admin' ? [{ path: item.path, title: item.title }] : []
})

function onSelect() { /* router handles it */ }
function goBack() { router.push('/dashboard') }
function reload() { router.replace({ path: '/redirect' + route.fullPath }).catch(() => router.go(0)) }

async function logout() {
  try {
    await ElMessageBox.confirm('确定要登出管理控制台吗？', '确认登出', { type: 'warning' })
  } catch { return }
  authStore.logout()
  ElMessage.success('已登出')
  router.push('/login')
}

onMounted(() => {
  // 权限校验
  if (!user.value || user.value.role !== 'admin') {
    ElMessage.error('需要管理员权限')
    router.replace('/dashboard')
  }
})
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fb;
}

.admin-sidebar {
  width: 220px;
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
  position: sticky;
  top: 0;
  height: 100vh;
}

.admin-sidebar.collapsed { width: 64px; }

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}

.logo-text { font-size: 15px; }

.collapse-btn {
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.15s;
}
.collapse-btn:hover { color: #fff; }

.admin-menu {
  flex: 1;
  border-right: 0;
  padding: 8px 0;
  background: transparent !important;
}
.admin-menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.75) !important;
  height: 44px;
  line-height: 44px;
  margin: 2px 8px;
  border-radius: 6px;
}
.admin-menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.06) !important;
  color: #fff !important;
}
.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, #3b82f6 0%, #6366f1 100%) !important;
  color: #fff !important;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.25);
}
.menu-badge { margin-left: 8px; }

.sidebar-footer {
  padding: 8px 12px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.back-btn {
  width: 100%;
  color: rgba(255, 255, 255, 0.75) !important;
  justify-content: flex-start;
}

.admin-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left :deep(.el-breadcrumb__inner) {
  color: #6b7280;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
}

.admin-content {
  flex: 1;
  padding: 20px 24px;
  overflow: auto;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.fade-page-enter-active, .fade-page-leave-active { transition: opacity 0.18s, transform 0.18s; }
.fade-page-enter-from { opacity: 0; transform: translateY(4px); }
.fade-page-leave-to { opacity: 0; transform: translateY(-4px); }

@media (max-width: 768px) {
  .admin-sidebar { width: 64px; }
  .admin-sidebar .logo-text, .admin-sidebar .menu-badge { display: none; }
  .admin-content { padding: 12px; }
  .admin-header { padding: 0 12px; }
  .role-tag :deep(span:not(:last-child)) { display: none; }
}
</style>
