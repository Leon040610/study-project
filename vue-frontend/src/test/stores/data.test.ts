import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataStore } from '@/stores/data'
import type { Goal, Plan, Task } from '@/stores/data'

// Mock the api module
vi.mock('@/utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from '@/utils/api'

describe('DataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty arrays', () => {
      const store = useDataStore()
      expect(store.goals).toEqual([])
      expect(store.plans).toEqual([])
      expect(store.tasks).toEqual([])
    })
  })

  describe('fetchAllData', () => {
    it('should fetch goals, plans, and tasks in parallel', async () => {
      const mockGoals: Goal[] = [
        { id: '1', title: 'Goal 1', description: '', category: 'test', targetDate: '2024-12-31', status: '进行中', progress: 0 },
      ]
      const mockPlans: Plan[] = [
        { id: '1', title: 'Plan 1', category: 'test' },
      ]
      const mockTasks: Task[] = [
        { id: '1', title: 'Task 1', planTitle: 'Plan 1', date: '2024-06-20', completed: false },
      ]

      vi.mocked(api.get).mockImplementation((url: string) => {
        if (url === '/goals') return Promise.resolve(mockGoals)
        if (url === '/plans') return Promise.resolve(mockPlans)
        if (url === '/tasks') return Promise.resolve(mockTasks)
        return Promise.resolve([])
      })

      const store = useDataStore()
      await store.fetchAllData()

      expect(store.goals).toEqual(mockGoals)
      expect(store.plans).toEqual(mockPlans)
      expect(store.tasks).toEqual(mockTasks)
    })

    it('should handle API errors gracefully with empty arrays', async () => {
      vi.mocked(api.get).mockRejectedValue('Network error')

      const store = useDataStore()
      await store.fetchAllData()

      expect(store.goals).toEqual([])
      expect(store.plans).toEqual([])
      expect(store.tasks).toEqual([])
    })

    it('should handle non-array responses', async () => {
      vi.mocked(api.get).mockResolvedValue({ not: 'an array' })

      const store = useDataStore()
      await store.fetchAllData()

      expect(store.goals).toEqual([])
      expect(store.plans).toEqual([])
      expect(store.tasks).toEqual([])
    })
  })

  describe('todayTasks computed', () => {
    it('should filter tasks by date field for single-day tasks', () => {
      const store = useDataStore()
      const today = new Date().toISOString().split('T')[0]

      store.tasks = [
        { id: '1', title: 'Today Task', planTitle: 'Plan', date: today, completed: false },
        { id: '2', title: 'Tomorrow Task', planTitle: 'Plan', date: '2024-12-31', completed: false },
      ] as Task[]

      expect(store.todayTasks).toHaveLength(1)
      expect(store.todayTasks[0].title).toBe('Today Task')
    })

    it('should filter tasks by startDate/endDate range', () => {
      const store = useDataStore()
      const today = new Date().toISOString().split('T')[0]

      store.tasks = [
        {
          id: '1',
          title: 'Range Task',
          planTitle: 'Plan',
          date: '',
          completed: false,
          startDate: today,
          endDate: today,
        },
        {
          id: '2',
          title: 'Out of Range',
          planTitle: 'Plan',
          date: '',
          completed: false,
          startDate: '2024-01-01',
          endDate: '2024-01-02',
        },
      ] as Task[]

      expect(store.todayTasks).toHaveLength(1)
      expect(store.todayTasks[0].title).toBe('Range Task')
    })
  })

  describe('goal computed filters', () => {
    it('should filter in-progress goals', () => {
      const store = useDataStore()
      store.goals = [
        { id: '1', title: 'G1', description: '', category: '', targetDate: '', status: '进行中', progress: 0 },
        { id: '2', title: 'G2', description: '', category: '', targetDate: '', status: '已完成', progress: 100 },
      ] as Goal[]

      expect(store.inProgressGoals).toHaveLength(1)
      expect(store.inProgressGoals[0].title).toBe('G1')
    })

    it('should filter completed goals', () => {
      const store = useDataStore()
      store.goals = [
        { id: '1', title: 'G1', description: '', category: '', targetDate: '', status: '进行中', progress: 0 },
        { id: '2', title: 'G2', description: '', category: '', targetDate: '', status: '已完成', progress: 100 },
      ] as Goal[]

      expect(store.completedGoals).toHaveLength(1)
      expect(store.completedGoals[0].title).toBe('G2')
    })

    it('should filter abandoned goals', () => {
      const store = useDataStore()
      store.goals = [
        { id: '1', title: 'G1', description: '', category: '', targetDate: '', status: '已放弃', progress: 0 },
      ] as Goal[]

      expect(store.abandonedGoals).toHaveLength(1)
    })
  })

  describe('isTaskCompletedOnDate', () => {
    it('should return true when completedDates has the date marked true', () => {
      const store = useDataStore()
      const task: Task = {
        id: '1',
        title: 'Task',
        planTitle: 'Plan',
        date: '2024-06-20',
        completed: false,
        completedDates: { '2024-06-20': true },
      }

      expect(store.isTaskCompletedOnDate(task, '2024-06-20')).toBe(true)
    })

    it('should return false when completedDates has the date marked false', () => {
      const store = useDataStore()
      const task: Task = {
        id: '1',
        title: 'Task',
        planTitle: 'Plan',
        date: '2024-06-20',
        completed: false,
        completedDates: { '2024-06-20': false },
      }

      expect(store.isTaskCompletedOnDate(task, '2024-06-20')).toBe(false)
    })

    it('should return false when completedDates is missing (no fallback to global completed)', () => {
      const store = useDataStore()
      const task: Task = {
        id: '1',
        title: 'Task',
        planTitle: 'Plan',
        date: '2024-06-20',
        completed: true,
      }

      // 严格按日期隔离：无 completedDates 时返回 false，不回退到全局 completed
      expect(store.isTaskCompletedOnDate(task, '2024-06-20')).toBe(false)
    })

    it('should return false for a date not in completedDates', () => {
      const store = useDataStore()
      const task: Task = {
        id: '1',
        title: 'Task',
        planTitle: 'Plan',
        date: '2024-06-20',
        completed: false,
        completedDates: { '2024-06-19': true },
      }

      expect(store.isTaskCompletedOnDate(task, '2024-06-20')).toBe(false)
    })
  })

  describe('toggleTaskOnDate', () => {
    it('should set completedDates for the given date without polluting global completed', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()
      store.tasks = [
        { id: '1', title: 'Task', planTitle: 'Plan', date: '2024-06-20', completed: false } as Task,
      ]

      await store.toggleTaskOnDate('1', '2024-06-20', true)

      expect(store.tasks[0].completedDates).toBeDefined()
      expect(store.tasks[0].completedDates!['2024-06-20']).toBe(true)
      // 不再同步修改全局 completed 字段，避免污染其他日期/其他模块
      expect(store.tasks[0].completed).toBe(false)
    })

    it('should not modify global completed field when toggling (date isolation)', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()
      store.tasks = [
        { id: '1', title: 'Task', planTitle: 'Plan', date: '2024-06-20', completed: true } as Task,
      ]

      await store.toggleTaskOnDate('1', '2024-06-20', false)

      // 全局 completed 保持原值，仅 completedDates 被更新
      expect(store.tasks[0].completed).toBe(true)
      expect(store.tasks[0].completedDates!['2024-06-20']).toBe(false)
    })

    it('should call API with only completedDates (no global completed)', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()
      store.tasks = [
        { id: '1', title: 'Task', planTitle: 'Plan', date: '2024-06-20', completed: false } as Task,
      ]

      await store.toggleTaskOnDate('1', '2024-06-20', true)

      expect(api.put).toHaveBeenCalledWith('/tasks/1', {
        completedDates: { '2024-06-20': true },
      })
    })

    it('should do nothing when task not found', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()

      await store.toggleTaskOnDate('nonexistent', '2024-06-20', true)

      expect(api.put).not.toHaveBeenCalled()
    })
  })

  describe('addGoal', () => {
    it('should add goal to local state and call API', async () => {
      vi.mocked(api.post).mockResolvedValue({})
      const store = useDataStore()

      const goalData = {
        title: 'New Goal',
        description: 'Description',
        category: 'test',
        targetDate: '2024-12-31',
      }

      const result = await store.addGoal(goalData)

      expect(store.goals).toHaveLength(1)
      expect(store.goals[0].title).toBe('New Goal')
      expect(store.goals[0].status).toBe('进行中')
      expect(store.goals[0].progress).toBe(0)
      expect(result.title).toBe('New Goal')
    })
  })

  describe('updateGoal', () => {
    it('should update goal in local state and call API', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()
      store.goals = [
        { id: '1', title: 'Old', description: '', category: '', targetDate: '', status: '进行中', progress: 0 },
      ] as Goal[]

      await store.updateGoal('1', { title: 'Updated', progress: 50 })

      expect(store.goals[0].title).toBe('Updated')
      expect(store.goals[0].progress).toBe(50)
      expect(api.put).toHaveBeenCalledWith('/goals/1', { title: 'Updated', progress: 50 })
    })

    it('should do nothing when goal not found', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()

      await store.updateGoal('nonexistent', { title: 'Updated' })

      expect(api.put).not.toHaveBeenCalled()
    })
  })

  describe('deleteGoal', () => {
    it('should remove goal from local state and call API', async () => {
      vi.mocked(api.delete).mockResolvedValue({})
      const store = useDataStore()
      store.goals = [
        { id: '1', title: 'Goal', description: '', category: '', targetDate: '', status: '进行中', progress: 0 },
      ] as Goal[]

      await store.deleteGoal('1')

      expect(store.goals).toHaveLength(0)
      expect(api.delete).toHaveBeenCalledWith('/goals/1')
    })
  })

  describe('updateGoalProgressByTask', () => {
    it('should update goal progress based on task completion (today)', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()
      const today = new Date().toISOString().split('T')[0]

      store.goals = [
        { id: 'g1', title: 'Goal 1', description: '', category: '', targetDate: '', status: '进行中', progress: 0 },
      ] as Goal[]
      store.plans = [
        { id: 'p1', title: 'Plan 1', category: '', goalTitle: 'Goal 1' },
      ] as Plan[]
      store.tasks = [
        { id: 't1', title: 'Task 1', planTitle: 'Plan 1', date: '', completed: false },
        { id: 't2', title: 'Task 2', planTitle: 'Plan 1', date: '', completed: false },
      ] as Task[]

      // 在"今日"勾选 t1，进度应为 50%
      await store.toggleTaskOnDate('t1', today, true)

      expect(store.goals[0].progress).toBe(50)
    })

    it('should set goal status to completed when all tasks done (today)', async () => {
      vi.mocked(api.put).mockResolvedValue({})
      const store = useDataStore()
      const today = new Date().toISOString().split('T')[0]

      store.goals = [
        { id: 'g1', title: 'Goal 1', description: '', category: '', targetDate: '', status: '进行中', progress: 0 },
      ] as Goal[]
      store.plans = [
        { id: 'p1', title: 'Plan 1', category: '', goalTitle: 'Goal 1' },
      ] as Plan[]
      store.tasks = [
        { id: 't1', title: 'Task 1', planTitle: 'Plan 1', date: '', completed: false },
        { id: 't2', title: 'Task 2', planTitle: 'Plan 1', date: '', completed: false },
      ] as Task[]

      // 在"今日"勾选所有任务，进度应为 100%
      await store.toggleTaskOnDate('t1', today, true)
      await store.toggleTaskOnDate('t2', today, true)

      expect(store.goals[0].progress).toBe(100)
      expect(store.goals[0].status).toBe('已完成')
    })
  })
})
