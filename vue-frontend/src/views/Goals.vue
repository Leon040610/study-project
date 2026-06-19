<template>
  <div class="goals-page">
    <div class="page-header">
      <h2>学习目标管理</h2>
      <el-button type="primary" @click="showCreateModal = true">
        <el-icon><Plus /></el-icon>
        <span>创建目标</span>
      </el-button>
    </div>

    <div class="goals-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="进行中" name="in-progress">
          <el-card>
            <div v-if="inProgressGoals.length === 0" class="empty-state">
              <el-icon style="font-size: 48px; color: var(--text-tertiary);"><Aim /></el-icon>
              <p>暂无进行中的目标</p>
            </div>
            <div v-else class="goals-grid">
              <div
                v-for="goal in inProgressGoals"
                :key="goal.id"
                class="goal-card"
              >
                <div class="goal-header">
                  <h3>{{ goal.title }}</h3>
                  <el-tag>{{ goal.category }}</el-tag>
                </div>
                <p class="goal-desc">{{ goal.description }}</p>
                <div class="goal-meta">
                  <span>截止日期：{{ goal.targetDate }}</span>
                  <span>进度：{{ goal.progress }}%</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" :style="{ width: goal.progress + '%' }"></div>
                </div>
                <div class="goal-actions">
                  <el-button size="small" @click="editGoal(goal)">编辑</el-button>
                  <el-button size="small" type="danger" @click="deleteGoal(goal)">删除</el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="已完成" name="completed">
          <el-card>
            <div v-if="completedGoals.length === 0" class="empty-state">
              <el-icon style="font-size: 48px; color: var(--text-tertiary);"><Check /></el-icon>
              <p>暂无已完成的目标</p>
            </div>
            <div v-else class="goals-grid">
              <div
                v-for="goal in completedGoals"
                :key="goal.id"
                class="goal-card completed"
              >
                <div class="goal-header">
                  <h3>{{ goal.title }}</h3>
                  <el-tag type="success">已完成</el-tag>
                </div>
                <p class="goal-desc">{{ goal.description }}</p>
                <div class="goal-meta">
                  <span>完成日期：{{ goal.completedDate }}</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" style="width: 100%;"></div>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="已放弃" name="abandoned">
          <el-card>
            <div v-if="abandonedGoals.length === 0" class="empty-state">
              <el-icon style="font-size: 48px; color: var(--text-tertiary);"><CircleClose /></el-icon>
              <p>暂无已放弃的目标</p>
            </div>
            <div v-else class="goals-grid">
              <div
                v-for="goal in abandonedGoals"
                :key="goal.id"
                class="goal-card abandoned"
              >
                <div class="goal-header">
                  <h3>{{ goal.title }}</h3>
                  <el-tag type="danger">已放弃</el-tag>
                </div>
                <p class="goal-desc">{{ goal.description }}</p>
                <div class="goal-meta">
                  <span>放弃日期：{{ goal.abandonedDate }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <el-dialog v-model="showCreateModal" :title="editingGoal ? '编辑目标' : '创建目标'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="目标名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入目标名称" />
        </el-form-item>
        <el-form-item label="目标分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option label="考试科目" value="考试科目" />
            <el-option label="技能学习" value="技能学习" />
            <el-option label="语言学习" value="语言学习" />
            <el-option label="证书考试" value="证书考试" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标描述" prop="description">
          <el-input type="textarea" v-model="form.description" :rows="3" placeholder="请输入目标描述" />
        </el-form-item>
        <el-form-item label="截止日期" prop="targetDate">
          <el-date-picker v-model="form.targetDate" type="date" placeholder="选择截止日期" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useDataStore } from '@/stores/data'
import { Plus, Aim, Check, CircleClose } from '@element-plus/icons-vue'

const dataStore = useDataStore()

const activeTab = ref('in-progress')
const showCreateModal = ref(false)
const editingGoal = ref<typeof dataStore.goals[0] | null>(null)
const formRef = ref()

const form = reactive({
  title: '',
  description: '',
  category: '',
  targetDate: ''
})

const rules = {
  title: [{ required: true, message: '请输入目标名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择目标分类', trigger: 'blur' }],
  targetDate: [{ required: true, message: '请选择截止日期', trigger: 'blur' }]
}

const inProgressGoals = computed(() => dataStore.inProgressGoals)
const completedGoals = computed(() => dataStore.completedGoals)
const abandonedGoals = computed(() => dataStore.abandonedGoals)

onMounted(async () => {
  await dataStore.fetchAllData()
})

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})
  
  try {
    if (editingGoal.value) {
      await dataStore.updateGoal(editingGoal.value.id, form)
      ElMessage.success('修改成功')
    } else {
      await dataStore.addGoal(form)
      ElMessage.success('创建成功')
    }
    showCreateModal.value = false
    form.title = ''
    form.description = ''
    form.category = ''
    form.targetDate = ''
    editingGoal.value = null
  } catch {
    ElMessage.error('操作失败')
  }
}

function editGoal(goal: typeof dataStore.goals[0]) {
  editingGoal.value = goal
  form.title = goal.title
  form.description = goal.description
  form.category = goal.category
  form.targetDate = goal.targetDate
  showCreateModal.value = true
}

async function deleteGoal(goal: typeof dataStore.goals[0]) {
  await dataStore.deleteGoal(goal.id)
  ElMessage.success('删除成功')
}
</script>

<style scoped>
.goals-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
}

.goals-tabs {
  width: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px;
  color: var(--text-tertiary);
}

.empty-state p {
  margin-top: 12px;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.goal-card {
  padding: 20px;
  background: var(--bg-surface);
  border-radius: 12px;
  border: 1px solid var(--border-default);
}

.goal-card.completed {
  border-color: var(--color-success);
  background: var(--color-success-subtle);
}

.goal-card.abandoned {
  border-color: var(--color-danger);
  background: var(--color-danger-subtle);
  opacity: 0.7;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.goal-header h3 {
  margin: 0;
  font-size: 18px;
}

.goal-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0 0 16px;
}

.goal-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.progress-bar-container {
  height: 8px;
  background: var(--bg-surface-hover);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-info));
  border-radius: 4px;
  transition: width 0.5s;
}

.goal-card.completed .progress-bar {
  background: var(--color-success);
}

.goal-actions {
  display: flex;
  gap: 8px;
}
</style>
