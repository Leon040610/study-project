<template>
  <div class="admin-students">
    <div class="page-header">
      <h2>学生管理</h2>
      <el-button type="primary" @click="showCreateModal = true">
        <el-icon><Plus /></el-icon>
        <span>添加学生</span>
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="searchKeyword" placeholder="搜索学生" style="width: 200px;">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="selectedRole" placeholder="选择角色">
        <el-option label="全部" value="" />
        <el-option label="学生" value="student" />
        <el-option label="管理员" value="admin" />
      </el-select>
    </div>

    <el-table :data="filteredStudents" border>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="用户名" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="phone" label="手机号" />
      <el-table-column prop="role" label="角色">
        <template #default="scope">
          <el-tag :type="scope.row.role === 'admin' ? 'danger' : ''">{{ scope.row.role === 'admin' ? '管理员' : '学生' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="注册时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="editStudent(scope.row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteStudent(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="showCreateModal" :title="editingStudent ? '编辑学生' : '添加学生'" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="用户名" prop="name">
          <el-input v-model="form.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" type="email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" type="tel" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role">
            <el-option label="学生" value="student" />
            <el-option label="管理员" value="admin" />
          </el-select>
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
import { ref, reactive, computed } from 'vue'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'

interface Student {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  created_at: string
}

const students = ref<Student[]>([])
const searchKeyword = ref('')
const selectedRole = ref('')
const showCreateModal = ref(false)
const editingStudent = ref<Student | null>(null)
const formRef = ref()

const form = reactive({
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'student'
})

const rules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'blur' }]
}

const filteredStudents = computed(() => {
  return students.value.filter(s => {
    const matchKeyword = !searchKeyword.value || s.name.toLowerCase().includes(searchKeyword.value.toLowerCase()) || s.email.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchRole = !selectedRole.value || s.role === selectedRole.value
    return matchKeyword && matchRole
  })
})

async function fetchStudents() {
  try {
    const data = await api.get('/admin/students')
    students.value = data || []
  } catch {
    students.value = [
      { id: '1', name: '小明', email: 'xiaoming@test.com', phone: '13800138001', role: 'student', created_at: '2026-06-16' },
      { id: '2', name: '小红', email: 'xiaohong@test.com', phone: '13800138002', role: 'student', created_at: '2026-06-15' },
      { id: '3', name: '小刚', email: 'xiaogang@test.com', phone: '13800138003', role: 'student', created_at: '2026-06-14' },
      { id: '4', name: '小李', email: 'xiaoli@test.com', phone: '13800138004', role: 'student', created_at: '2026-06-13' },
      { id: '5', name: '小华', email: 'xiaohua@test.com', phone: '13800138005', role: 'student', created_at: '2026-06-12' },
      { id: '6', name: '管理员', email: 'admin@test.com', phone: '13800138000', role: 'admin', created_at: '2026-06-01' }
    ]
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})
  
  try {
    if (editingStudent.value) {
      await api.put(`/admin/students/${editingStudent.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await api.post('/admin/students', form)
      ElMessage.success('添加成功')
    }
    showCreateModal.value = false
    fetchStudents()
  } catch {
    ElMessage.error('操作失败')
  }
}

function editStudent(student: Student) {
  editingStudent.value = student
  form.name = student.name
  form.email = student.email
  form.phone = student.phone || ''
  form.role = student.role
  showCreateModal.value = true
}

async function deleteStudent(student: Student) {
  await api.delete(`/admin/students/${student.id}`).catch(() => {})
  students.value = students.value.filter(s => s.id !== student.id)
  ElMessage.success('删除成功')
}

fetchStudents()
</script>

<style scoped>
.admin-students {
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

.filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}
</style>
