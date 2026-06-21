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
      const response = await api.post('/goals', newGoal) as any
      // 用后端返回的真实数据替换本地临时数据
      if (response && response.id) {
        const index = goals.value.findIndex(g => g.id === newGoal.id)
        if (index !== -1) {
          goals.value[index] = { ...goals.value[index], ...response, id: response.id }
        }
      }
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
      const response = await api.post('/plans', newPlan) as any
      // 用后端返回的真实数据替换本地临时数据
      if (response && response.id) {
        const index = plans.value.findIndex(p => p.id === newPlan.id)
        if (index !== -1) {
          plans.value[index] = { ...plans.value[index], ...response, id: response.id }
        }
      }
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
    // 在删除前先记录计划的标题，用于级联删除关联任务
    const planToDelete = plans.value.find(p => p.id === id)

    // 1. 删除计划本身（本地状态 + 后端）
    plans.value = plans.value.filter(p => p.id !== id)
    try {
      await api.delete(`/plans/${id}`)
    } catch {}

    // 2. 级联删除该计划下的所有任务（本地状态 + 后端）
    // 否则日历视图重新拉取数据时仍会看到这些"幽灵任务"
    if (planToDelete) {
      const relatedTasks = tasks.value.filter(t => t.planTitle === planToDelete.title)
      for (const t of relatedTasks) {
        tasks.value = tasks.value.filter(x => x.id !== t.id)
        try {
          await api.delete(`/tasks/${t.id}`)
        } catch {}
      }
    }
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
      const response = await api.post('/tasks', newTask) as any
      // 用后端返回的真实数据替换本地临时数据
      if (response && response.id) {
        const index = tasks.value.findIndex(t => t.id === newTask.id)
        if (index !== -1) {
          tasks.value[index] = { ...tasks.value[index], ...response, id: response.id }
        }
      }
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
  // 严格以 completedDates 为唯一数据源，不回退到全局 completed
  function isTaskCompletedOnDate(task: Task, dateStr: string): boolean {
    if (task.completedDates) {
      return task.completedDates[dateStr] === true
    }
    return false
  }

  // 判断任务是否已"完全完成"
  // 规则：只有当任务周期内（或其唯一日期）的所有日期都被勾选时，才视为完成
  // 用于计算计划/目标进度，避免单日勾选即推进 50%
  function isTaskFullyCompleted(task: Task): boolean {
    // 旧数据 / 无周期字段：使用 date 字段
    if (!task.startDate || !task.endDate) {
      return task.completedDates?.[task.date] === true
    }

    // 新数据：周期内所有日期都必须勾选
    const start = new Date(`${task.startDate}T00:00:00`)
    const end = new Date(`${task.endDate}T00:00:00`)
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return task.completedDates?.[task.date] === true
    }

    const cursor = new Date(start)
    while (cursor <= end) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`
      if (!task.completedDates || task.completedDates[dateStr] !== true) {
        return false
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    return true
  }

  // 切换任务在指定日期的完成状态（日期隔离）
  // 仅更新 completedDates，不再污染全局 completed 字段
  async function toggleTaskOnDate(taskId: string, dateStr: string, completed: boolean) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index === -1) return
    const oldTask = tasks.value[index]
    const newCompletedDates = {
      ...(oldTask.completedDates || {}),
      [dateStr]: completed
    }
    // 替换 task 对象（而非属性变更）确保响应式可靠触发组件重新渲染
    tasks.value[index] = { ...oldTask, completedDates: newCompletedDates }
    // 不再同步修改 task.completed，避免污染其他日期/其他模块的显示
    try {
      await api.put(`/tasks/${taskId}`, { completedDates: newCompletedDates })
    } catch {}
    updateGoalProgressByTask(tasks.value[index])
  }

  // 切换任务在整个周期内的完成状态
  // 用于"周期任务"语义：勾选一个任务 = 标记周期内所有日期为完成/未完成
  // 这样日历视图左侧所有相关日期的指示器都会同步更新
  async function toggleTaskCycle(taskId: string, completed: boolean) {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index === -1) return
    const oldTask = tasks.value[index]

    // 计算周期内的所有日期字符串
    const dateStrs: string[] = []
    if (!oldTask.startDate || !oldTask.endDate) {
      // 旧数据：只更新 task.date
      if (oldTask.date) dateStrs.push(oldTask.date)
    } else {
      const start = new Date(`${oldTask.startDate}T00:00:00`)
      const end = new Date(`${oldTask.endDate}T00:00:00`)
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
        if (oldTask.date) dateStrs.push(oldTask.date)
      } else {
        const cursor = new Date(start)
        while (cursor <= end) {
          const y = cursor.getFullYear()
          const m = String(cursor.getMonth() + 1).padStart(2, '0')
          const d = String(cursor.getDate()).padStart(2, '0')
          dateStrs.push(`${y}-${m}-${d}`)
          cursor.setDate(cursor.getDate() + 1)
        }
      }
    }

    // 构造新的 completedDates 对象
    const newCompletedDates: Record<string, boolean> = { ...(oldTask.completedDates || {}) }
    for (const ds of dateStrs) {
      newCompletedDates[ds] = completed
    }

    // 替换 task 对象（而非属性变更）确保响应式可靠触发
    tasks.value[index] = { ...oldTask, completedDates: newCompletedDates }

    try {
      await api.put(`/tasks/${taskId}`, { completedDates: newCompletedDates })
    } catch {}
    updateGoalProgressByTask(tasks.value[index])
  }

  // 根据任务完成情况更新关联目标的进度
  // 进度按"已完全完成的任务数 / 总任务数"计算，确保单日勾选不会推进进度
  function updateGoalProgressByTask(task: Task) {
    // 找到任务关联的计划
    const plan = plans.value.find(p => p.title === task.planTitle)
    if (!plan || !plan.goalTitle) return

    // 找到关联的目标
    const goal = goals.value.find(g => g.title === plan.goalTitle)
    if (!goal) return

    // 按"完全完成"统计进度
    const planTasks = tasks.value.filter(t => t.planTitle === plan.title)
    const completedCount = planTasks.filter(t => isTaskFullyCompleted(t)).length
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
    isTaskFullyCompleted,
    toggleTaskOnDate,
    toggleTaskCycle
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