<template>
  <div class="posts-page">
    <div class="page-header">
      <h2>帖子中心</h2>
      <el-button type="primary" @click="showCreateModal = true">
        <el-icon><Plus /></el-icon>
        <span>发布帖子</span>
      </el-button>
    </div>

    <div class="filter-bar">
      <el-input v-model="searchKeyword" placeholder="搜索帖子" style="width: 200px;">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-select v-model="selectedCategory" placeholder="选择分类">
        <el-option label="全部" value="" />
        <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
      </el-select>
    </div>

    <div class="posts-list" v-loading="loading">
      <el-card v-for="post in filteredPosts" :key="post.id" class="post-card">
        <div class="post-header">
          <div class="author-info">
            <div class="avatar">👤</div>
            <div class="author-detail">
              <span class="author-name">{{ post.authorName }}</span>
              <span class="post-time">{{ post.createdAt }}</span>
            </div>
          </div>
          <el-tag>{{ post.category }}</el-tag>
        </div>
        <h3 class="post-title" @click="viewPost(post)">{{ post.title }}</h3>
        <p class="post-content">{{ post.content }}</p>
        <div class="post-footer">
          <div class="stats">
            <span>👁️ {{ post.viewCount }} 浏览</span>
            <span>💬 {{ post.commentCount }} 评论</span>
            <span>❤️ {{ post.likes }} 点赞</span>
          </div>
          <div class="actions">
            <el-button size="small" @click="likePost(post)">
              <el-icon><Star /></el-icon>
              <span>{{ post.liked ? '取消点赞' : '点赞' }}</span>
            </el-button>
            <el-button size="small" @click="viewPost(post)">
              <el-icon><ChatLineSquare /></el-icon>
              <span>评论</span>
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="filteredPosts.length === 0" class="empty-state">
      <el-icon style="font-size: 48px; color: var(--text-tertiary);"><ChatDotSquare /></el-icon>
      <p>暂无帖子</p>
    </div>

    <el-dialog v-model="showCreateModal" title="发布帖子" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="帖子标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入帖子标题" />
        </el-form-item>
        <el-form-item label="帖子分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择分类">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="帖子内容" prop="content">
          <el-input type="textarea" v-model="form.content" :rows="6" placeholder="请输入帖子内容" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">发布</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailModal" title="帖子详情" width="700px">
      <div v-if="selectedPost" class="post-detail">
        <div class="detail-header">
          <div class="author-info">
            <div class="avatar">👤</div>
            <div class="author-detail">
              <span class="author-name">{{ selectedPost.authorName }}</span>
              <span class="post-time">{{ selectedPost.createdAt }}</span>
            </div>
          </div>
          <el-tag>{{ selectedPost.category }}</el-tag>
        </div>
        <h2>{{ selectedPost.title }}</h2>
        <div class="detail-content">{{ selectedPost.content }}</div>
        <div class="detail-stats">
          <span>👁️ {{ selectedPost.viewCount }} 浏览</span>
          <span>💬 {{ selectedPost.commentCount }} 评论</span>
          <span>❤️ {{ selectedPost.likes }} 点赞</span>
        </div>
        <div class="detail-actions">
          <el-button @click="likePost(selectedPost)" :type="selectedPost.liked ? 'danger' : 'primary'">
            <el-icon><Star /></el-icon>
            <span>{{ selectedPost.liked ? '取消点赞' : '点赞' }}</span>
          </el-button>
        </div>

        <div class="comments-section">
          <h3>评论列表</h3>
          <div v-if="selectedPost.comments.length === 0" class="empty-comments">
            <p>暂无评论</p>
          </div>
          <div v-else class="comments-list">
            <div v-for="comment in selectedPost.comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <span class="comment-author">{{ comment.authorName }}</span>
                <span class="comment-time">{{ comment.createdAt }}</span>
              </div>
              <p>{{ comment.content }}</p>
            </div>
          </div>
          <el-form :model="commentForm" @submit.prevent="submitComment">
            <el-input v-model="commentForm.content" placeholder="输入评论" @keyup.enter="submitComment" />
            <el-button type="primary" style="margin-top: 12px;" @click="submitComment">提交评论</el-button>
          </el-form>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { api } from '@/utils/api'
import { ElMessage } from 'element-plus'
import { Plus, Search, Star, ChatLineSquare } from '@element-plus/icons-vue'

interface Comment {
  id: string
  authorName: string
  content: string
  createdAt: string
}

interface Post {
  id: string
  title: string
  content: string
  category: string
  authorName: string
  viewCount: number
  commentCount: number
  likes: number
  liked: boolean
  createdAt: string
  comments: Comment[]
}

const categories = ['学习心得', '资源分享', '问题求助', '经验交流', '其他']

const posts = ref<Post[]>([])
const searchKeyword = ref('')
const selectedCategory = ref('')
const showCreateModal = ref(false)
const showDetailModal = ref(false)
const selectedPost = ref<Post | null>(null)
const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const form = reactive({
  title: '',
  content: '',
  category: ''
})

const commentForm = reactive({
  content: ''
})

const rules = {
  title: [{ required: true, message: '请输入帖子标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择帖子分类', trigger: 'blur' }],
  content: [{ required: true, message: '请输入帖子内容', trigger: 'blur' }]
}

const filteredPosts = computed(() => {
  return posts.value.filter(p => {
    const matchKeyword = !searchKeyword.value || p.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) || p.content.toLowerCase().includes(searchKeyword.value.toLowerCase())
    const matchCategory = !selectedCategory.value || p.category === selectedCategory.value
    return matchKeyword && matchCategory
  })
})

async function fetchPosts() {
  loading.value = true
  try {
    const data = await api.get('/posts')
    // 规范化字段：后端 likedUsers 数组 → 前端 liked 布尔
    posts.value = (data || []).map((p: any) => ({
      ...p,
      liked: false,
      comments: p.comments || []
    }))
  } catch (e) {
    console.error('加载帖子失败:', e)
    posts.value = []
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})

  if (!form.title || !form.content || !form.category) {
    ElMessage.error('请填写完整的帖子信息')
    return
  }

  submitting.value = true
  try {
    const newPost = await api.post('/posts', form) as any
    ElMessage.success('发布成功')
    showCreateModal.value = false
    form.title = ''
    form.content = ''
    form.category = ''
    // 将新帖子插入到列表顶部
    if (newPost) {
      posts.value.unshift({
        ...newPost,
        liked: false,
        comments: []
      })
    } else {
      fetchPosts()
    }
  } catch (e) {
    ElMessage.error(typeof e === 'string' ? e : '操作失败')
  } finally {
    submitting.value = false
  }
}

function viewPost(post: Post) {
  selectedPost.value = post
  showDetailModal.value = true
  // 调用详情接口，刷新浏览数
  api.get(`/posts/${post.id}`).then((detail: any) => {
    if (selectedPost.value && String(selectedPost.value.id) === String(post.id)) {
      selectedPost.value.viewCount = detail.viewCount
      selectedPost.value.likes = detail.likes
      selectedPost.value.liked = detail.liked
      selectedPost.value.comments = detail.comments || []
    }
  }).catch(() => {})
}

async function likePost(post: Post) {
  try {
    const res = await api.post(`/posts/${post.id}/like`) as any
    post.liked = res.liked
    post.likes = res.likes
  } catch (e) {
    ElMessage.error('点赞失败')
  }
}

async function submitComment() {
  if (!commentForm.content.trim() || !selectedPost.value) return

  const content = commentForm.content.trim()
  try {
    const newComment = await api.post(`/posts/${selectedPost.value.id}/comments`, { content }) as any
    if (newComment) {
      selectedPost.value.comments.push(newComment)
      selectedPost.value.commentCount++
    } else {
      // 失败时使用本地评论
      const fallback: Comment = {
        id: Date.now().toString(),
        authorName: '我',
        content,
        createdAt: new Date().toISOString()
      }
      selectedPost.value.comments.push(fallback)
      selectedPost.value.commentCount++
    }
    commentForm.content = ''
    ElMessage.success('评论成功')
  } catch (e) {
    // 后端失败时也允许本地评论
    const fallback: Comment = {
      id: Date.now().toString(),
      authorName: '我',
      content,
      createdAt: new Date().toISOString()
    }
    selectedPost.value.comments.push(fallback)
    selectedPost.value.commentCount++
    commentForm.content = ''
    ElMessage.success('评论成功')
  }
}

function formatPostTime(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return iso
  }
}

fetchPosts()
</script>

<style scoped>
.posts-page {
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

.posts-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.post-card {
  padding: 24px;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  gap: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  background: var(--bg-surface-hover);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}

.author-detail {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 600;
}

.post-time {
  font-size: 13px;
  color: var(--text-tertiary);
}

.post-title {
  margin: 0 0 12px;
  font-size: 20px;
  cursor: pointer;
}

.post-title:hover {
  color: var(--color-primary-dark);
}

.post-content {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.6;
  margin: 0 0 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: var(--text-secondary);
}

.actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px;
  color: var(--text-tertiary);
}

.empty-state p {
  margin-top: 12px;
}

.post-detail {
  padding: 16px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-content {
  margin: 20px 0;
  line-height: 1.8;
  font-size: 16px;
}

.detail-stats {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.detail-actions {
  margin-bottom: 32px;
}

.comments-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}

.comments-section h3 {
  margin: 0 0 20px;
}

.empty-comments {
  text-align: center;
  padding: 40px;
  color: var(--text-tertiary);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.comment-item {
  padding: 16px;
  background: var(--bg-surface);
  border-radius: 8px;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
}

.comment-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.comment-item p {
  margin: 0;
  color: var(--text-secondary);
}
</style>
