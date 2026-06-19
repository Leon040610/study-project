import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useDataStore = defineStore('data', () => {
  const goals = ref<Goal[]>([])
  const plans = ref<Plan[]>([])
  const tasks = ref<Task[]>([])

  const todayTasks = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.value.filter(t => {
      // 如果任务有 startDate 和 endDate，检查今天是否在范围内
      if (t.startDate && t.endDate) {
        return today >= t.startDate && today <= t.endDate
      }
      // 兼容旧数据：使用 date 字段
      return t.date === today
    })
  })

  const inProgressGoals = computed(() => goals.value.filter(g => g.status === '进行中'))
  const completedGoals = computed(() => goals.value.filter(g => g.status === '已完成'))
  const abandonedGoals = computed(() => goals.value.filter(g => g.status === '已放弃'))

  async function fetchAllData() {
    try {
      const [goalsData, plansData, tasksData] = await Promise.all([
        api.get('/goals').catch(() => []),
        api.get('/plans').catch(() => []),
        api.get('/tasks').catch(() => [])
      ])
      goals.value = Array.isArray(goalsData) ? goalsData : []
      plans.value = Array.isArray(plansData) ? plansData : []
      tasks.value = Array.isArray(tasksData) ? tasksData : []
    } catch {
      goals.value = []
      plans.value = []
      tasks.value = []
    }
  }

  async function addGoal(data: Omit<Goal, 'id' | 'progress' | 'status'>) {
    const newGoal: Goal = {
      ...data,
      id: Date.now().toString(),
      status: '进行中',
      progress: 0
    }
    goals.value.push(newGoal)
    try {
      await api.post('/goals', newGoal)
    } catch {}
    return newGoal
  }

  async function updateGoal(id: string, data: Partial<Goal>) {
    const index = goals.value.findIndex(g => g.id === id)
    if (index !== -1) {
      goals.value[index] = { ...goals.value[index], ...data }
      try {
        await api.put(`/goals/${id}`, data)
      } catch {}
    }
  }

  async function deleteGoal(id: string) {
    goals.value = goals.value.filter(g => g.id !== id)
    try {
      await api.delete(`/goals/${id}`)
    } catch {}
  }

  async function addPlan(data: Omit<Plan, 'id'>) {
    const newPlan: Plan = {
      ...data,
      id: Date.now().toString()
    }
    plans.value.push(newPlan)
    try {
      await api.post('/plans', newPlan)
    } catch {}
    return newPlan
  }

  async function updatePlan(id: string, data: Partial<Plan>) {
    const index = plans.value.findIndex(p => p.id === id)
    if (index !== -1) {
      plans.value[index] = { ...plans.value[index], ...data }
      try {
        await api.put(`/plans/${id}`, data)
      } catch {}
    }
  }

  async function deletePlan(id: string) {
    plans.value = plans.value.filter(p => p.id !== id)
    try {
      await api.delete(`/plans/${id}`)
    } catch {}
  }

  async function addTask(data: Omit<Task, 'id' | 'completed'>) {
    const newTask: Task = {
      ...data,
      id: Date.now().toString(),
      completed: false,
      completedDates: {}
    }
    tasks.value.push(newTask)
    try {
      await api.post('/tasks', newTask)
    } catch {}
    return newTask
  }

  async function updateTask(id: string, data: Partial<Task>) {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index !== -1) {
      tasks.value[index] = { ...tasks.value[index], ...data }
      try {
        await api.put(`/tasks/${id}`, data)
      } catch {}
      // 任务状态更新后，联动更新关联计划和目标进度
      updateGoalProgressByTask(tasks.value[index])
    }
  }

  // 判断任务在指定日期是否已完成（日期隔离）
  function isTaskCompletedOnDate(task: Task, dateStr: string): boolean {
    if (task.completedDates) {
      return task.completedDates[dateStr] === true
    }
    // 兼容旧数据：没有 completedDates 字段时回退到全局 completed
    return task.completed
  }

  // 切换任务在指定日期的完成状态（日期隔离）
  async function toggleTaskOnDate(taskId: string, dateStr: string, completed: boolean) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index === -1) return
    const task = tasks.value[index]
    if (!task.completedDates) {
      task.completedDates = {}
    }
    task.completedDates[dateStr] = completed
    // 同步 completed 字段，保持 Dashboard 等页面的统计兼容
    task.completed = completed
    try {
      await api.put(`/tasks/${taskId}`, { completedDates: task.completedDates, completed: task.completed })
    } catch {}
    updateGoalProgressByTask(task)
  }

  // 根据任务完成情况更新关联目标的进度
  function updateGoalProgressByTask(task: Task) {
    // 找到任务关联的计划
    const plan = plans.value.find(p => p.title === task.planTitle)
    if (!plan || !plan.goalTitle) return

    // 找到关联的目标
    const goal = goals.value.find(g => g.title === plan.goalTitle)
    if (!goal) return

    // 计算该计划下所有任务的完成情况
    const planTasks = tasks.value.filter(t => t.planTitle === plan.title)
    const completedCount = planTasks.filter(t => t.completed).length
    const progress = planTasks.length > 0 ? Math.round((completedCount / planTasks.length) * 100) : 0

    // 更新目标进度
    goal.progress = progress
    if (progress === 100) {
      goal.status = '已完成'
      goal.completedDate = new Date().toISOString().split('T')[0]
    } else if (goal.status === '已完成' && progress < 100) {
      goal.status = '进行中'
      goal.completedDate = undefined
    }

    // 同步到后端
    try {
      api.put(`/goals/${goal.id}`, { progress: goal.progress, status: goal.status, completedDate: goal.completedDate })
    } catch {}
  }

  async function deleteTask(id: string) {
    tasks.value = tasks.value.filter(t => t.id !== id)
    try {
      await api.delete(`/tasks/${id}`)
    } catch {}
  }

  return {
    goals,
    plans,
    tasks,
    todayTasks,
    inProgressGoals,
    completedGoals,
    abandonedGoals,
    fetchAllData,
    addGoal,
    updateGoal,
    deleteGoal,
    addPlan,
    updatePlan,
    deletePlan,
    addTask,
    updateTask,
    deleteTask,
    isTaskCompletedOnDate,
    toggleTaskOnDate
  }
})

export interface Goal {
  id: string
  title: string
  description: string
  category: string
  targetDate: string
  status: string
  progress: number
  completedDate?: string
  abandonedDate?: string
}

export interface Plan {
  id: string
  title: string
  category: string
  goalId?: string
  goalTitle?: string
  startDate?: string
  endDate?: string
  description?: string
}

export interface Task {
  id: string
  title: string
  planTitle: string
  date: string
  completed: boolean
  startDate?: string
  endDate?: string
  // 按日期记录完成状态，实现日期隔离勾选
  completedDates?: Record<string, boolean>
}