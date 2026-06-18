<template>
  <div class="admin-posts">
    <div class="page-header">
      <h2>帖子管理</h2>
    </div>
    <el-card>
      <el-table :data="posts" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="帖子标题" />
        <el-table-column prop="author_name" label="作者" width="120" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="view_count" label="浏览量" width="80" />
        <el-table-column prop="comment_count" label="评论数" width="80" />
        <el-table-column prop="likes" label="点赞数" width="80" />
        <el-table-column prop="created_at" label="发布时间" width="180" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="viewPost(scope.row)">查看</el-button>
            <el-button size="small" type="danger" @click="deletePost(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'

interface Post {
  id: string
  title: string
  author_name: string
  category: string
  view_count: number
  comment_count: number
  likes: number
  created_at: string
}

const posts = ref<Post[]>([])

async function fetchPosts() {
  try {
    const data = await api.get('/posts')
    posts.value = data || []
  } catch {
    posts.value = []
  }
}

function viewPost(post: Post) {
  ElMessage.info(`查看帖子: ${post.title}`)
}

async function deletePost(post: Post) {
  await api.delete(`/posts/${post.id}`).catch(() => {})
  posts.value = posts.value.filter(p => p.id !== post.id)
  ElMessage.success('删除成功')
}

onMounted(fetchPosts)
</script>

<style scoped>
.admin-posts {
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
}
</style>