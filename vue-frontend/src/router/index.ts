import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue')
    },
    {
      path: '/',
      component: () => import('@/layout/Layout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: '/dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: '/goals',
          name: 'Goals',
          component: () => import('@/views/Goals.vue')
        },
        {
          path: '/plans',
          name: 'Plans',
          component: () => import('@/views/Plans.vue')
        },
        {
          path: '/calendar',
          name: 'Calendar',
          component: () => import('@/views/Calendar.vue')
        },
        {
          path: '/resources',
          name: 'Resources',
          component: () => import('@/views/Resources.vue')
        },
        {
          path: '/posts',
          name: 'Posts',
          component: () => import('@/views/Posts.vue')
        },
        {
          path: '/reminders',
          name: 'Reminders',
          component: () => import('@/views/Reminders.vue')
        },
        {
          path: '/profile',
          name: 'Profile',
          component: () => import('@/views/Profile.vue')
        },
        {
          path: '/admin',
          name: 'Admin',
          component: () => import('@/views/admin/AdminDashboard.vue')
        },
        {
          path: '/admin/students',
          name: 'AdminStudents',
          component: () => import('@/views/admin/AdminStudents.vue')
        },
        {
          path: '/admin/plans',
          name: 'AdminPlans',
          component: () => import('@/views/admin/AdminPlans.vue')
        },
        {
          path: '/admin/resources',
          name: 'AdminResources',
          component: () => import('@/views/admin/AdminResources.vue')
        },
        {
          path: '/admin/posts',
          name: 'AdminPosts',
          component: () => import('@/views/admin/AdminPosts.vue')
        },
        {
          path: '/admin/announcements',
          name: 'AdminAnnouncements',
          component: () => import('@/views/admin/AdminAnnouncements.vue')
        },
        {
          path: '/admin/logs',
          name: 'AdminLogs',
          component: () => import('@/views/admin/AdminLogs.vue')
        },
        {
          path: '/admin/settings',
          name: 'AdminSettings',
          component: () => import('@/views/admin/AdminSettings.vue')
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isLoggedIn = authStore.isLoggedIn
  const user = authStore.user

  if (to.path === '/login') {
    if (isLoggedIn) {
      next('/dashboard')
    } else {
      next()
    }
  } else {
    if (!isLoggedIn) {
      next('/login')
    } else if (to.matched.some(r => r.meta?.requiresAdmin) && (!user || user.role !== 'admin')) {
      // 权限不足，跳回首页
      next('/dashboard')
    } else {
      next()
    }
  }
})

export default router
