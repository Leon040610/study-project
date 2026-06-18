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

  // 辅助函数：为计划生成任务（每个任务有独立的时间周期）
  function generateDefaultTasksForPlan(planTitle: string, tasks: { title: string; startDate: string; endDate: string }[]): Task[] {
    return tasks.map((t, index) => ({
      id: `${planTitle}-task-${index + 1}`,
      title: t.title,
      planTitle,
      date: t.startDate, // date 字段保留用于兼容，设为任务开始日期
      completed: false,
      startDate: t.startDate,
      endDate: t.endDate
    }))
  }

  async function fetchAllData() {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const defaultGoals: Goal[] = [
      { id: '1', title: '通过考研数学考试', description: '系统复习高等数学、线性代数、概率论', category: '考试科目', targetDate: '2026-12-20', status: '进行中', progress: 65 },
      { id: '2', title: '掌握Python编程', description: '学习Python基础语法和常用库', category: '技能学习', targetDate: '2026-08-30', status: '进行中', progress: 80 },
      { id: '3', title: '通过英语四级', description: '备考大学英语四级考试', category: '证书考试', targetDate: '2026-06-15', status: '已完成', progress: 100, completedDate: '2026-06-10' },
      { id: '4', title: '学习日语N2', description: '学习日语达到N2水平', category: '语言学习', targetDate: '2026-11-30', status: '已放弃', progress: 30, abandonedDate: '2026-05-20' }
    ]
    const defaultPlans: Plan[] = [
      { id: '1', title: '考研数学复习计划', category: '考试科目', goalTitle: '通过考研数学考试', startDate: '2026-06-01', endDate: '2026-12-20', description: '系统复习高等数学、线性代数、概率论' },
      { id: '2', title: 'Python学习计划', category: '技能学习', goalTitle: '掌握Python编程', startDate: '2026-05-01', endDate: '2026-08-30', description: '学习Python基础和常用库' },
      { id: '3', title: '英语学习计划', category: '语言学习', goalTitle: '通过英语四级', startDate: '2026-03-01', endDate: '2026-06-15', description: '备考大学英语四级考试' },
      { id: '4', title: '编程学习计划', category: '技能学习', goalTitle: '掌握Python编程', startDate: '2026-06-01', endDate: '2026-12-31', description: '日常编程练习' },
      { id: '5', title: '专业课复习计划', category: '考试科目', goalTitle: '通过考研数学考试', startDate: '2026-09-01', endDate: '2026-12-20', description: '复习专业课程' }
    ]
    
    // 每个计划的任务有独立的时间周期，不再每天重复生成
    const defaultTasks: Task[] = [
      ...generateDefaultTasksForPlan('考研数学复习计划', [
        { title: '复习高等数学', startDate: '2026-06-01', endDate: '2026-08-31' },
        { title: '复习线性代数', startDate: '2026-09-01', endDate: '2026-10-31' },
        { title: '复习概率论', startDate: '2026-11-01', endDate: '2026-12-20' },
        { title: '做历年真题', startDate: '2026-06-01', endDate: '2026-12-20' }
      ]),
      ...generateDefaultTasksForPlan('Python学习计划', [
        { title: '学习Python基础语法', startDate: '2026-05-01', endDate: '2026-06-15' },
        { title: '学习数据结构与算法', startDate: '2026-06-16', endDate: '2026-08-30' }
      ]),
      ...generateDefaultTasksForPlan('英语学习计划', [
        { title: '背诵单词', startDate: '2026-03-01', endDate: '2026-06-15' },
        { title: '阅读理解', startDate: '2026-03-01', endDate: '2026-06-15' },
        { title: '听力练习', startDate: '2026-03-01', endDate: '2026-06-15' }
      ]),
      ...generateDefaultTasksForPlan('编程学习计划', [
        { title: '编程实战练习', startDate: '2026-06-01', endDate: '2026-12-31' }
      ]),
      ...generateDefaultTasksForPlan('专业课复习计划', [
        { title: '复习专业课程', startDate: '2026-09-01', endDate: '2026-12-20' },
        { title: '做课后习题', startDate: '2026-09-01', endDate: '2026-12-20' }
      ])
    ]

    // 只有在本地数据为空时才从后端获取，避免覆盖本地修改
    if (goals.value.length === 0 && plans.value.length === 0 && tasks.value.length === 0) {
      try {
        const [goalsData, plansData, tasksData] = await Promise.all([
          api.get('/goals').catch(() => []),
          api.get('/plans').catch(() => []),
          api.get('/tasks').catch(() => [])
        ])
        goals.value = (goalsData && Array.isArray(goalsData) && goalsData.length > 0) ? goalsData : defaultGoals
        plans.value = (plansData && Array.isArray(plansData) && plansData.length > 0) ? plansData : defaultPlans
        tasks.value = (tasksData && Array.isArray(tasksData) && tasksData.length > 0) ? tasksData : defaultTasks
      } catch {
        goals.value = defaultGoals
        plans.value = defaultPlans
        tasks.value = defaultTasks
      }
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
      completed: false
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
    deleteTask
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
}