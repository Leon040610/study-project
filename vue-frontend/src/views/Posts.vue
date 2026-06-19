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

    <div class="posts-list">
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
        <el-button type="primary" @click="handleSubmit">发布</el-button>
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
  try {
    const data = await api.get('/posts')
    posts.value = data || []
  } catch {
    posts.value = [
      {
        id: '1',
        title: '考研数学复习经验分享',
        content: '今年考研数学考了135分，想和大家分享一下我的复习经验。首先，一定要打好基础，把教材上的例题都吃透...',
        category: '经验交流',
        authorName: '小明',
        viewCount: 1234,
        commentCount: 56,
        likes: 234,
        liked: false,
        createdAt: '2026-06-15',
        comments: [
          { id: 'c1', authorName: '小红', content: '感谢分享！很有帮助', createdAt: '2026-06-15' },
          { id: 'c2', authorName: '小刚', content: '请问用的什么参考书？', createdAt: '2026-06-15' }
        ]
      },
      {
        id: '2',
        title: '推荐一本Python入门好书',
        content: '最近读了《Python编程从入门到实践》，感觉非常适合初学者，内容通俗易懂，例子丰富...',
        category: '资源分享',
        authorName: '小李',
        viewCount: 856,
        commentCount: 34,
        likes: 156,
        liked: true,
        createdAt: '2026-06-14',
        comments: []
      },
      {
        id: '3',
        title: '英语四级备考求助',
        content: '还有一个月就要考四级了，听力和阅读都不太好，有没有学长学姐给点建议？',
        category: '问题求助',
        authorName: '小华',
        viewCount: 423,
        commentCount: 28,
        likes: 45,
        liked: false,
        createdAt: '2026-06-13',
        comments: []
      },
      {
        id: '4',
        title: '今日学习打卡',
        content: '今天完成了3个小时的学习，感觉效率不错！继续加油！💪',
        category: '学习心得',
        authorName: '小张',
        viewCount: 234,
        commentCount: 12,
        likes: 89,
        liked: false,
        createdAt: '2026-06-12',
        comments: []
      }
    ]
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate().catch(() => {})
  
  try {
    await api.post('/posts', form)
    ElMessage.success('发布成功')
    showCreateModal.value = false
    fetchPosts()
  } catch {
    ElMessage.error('操作失败')
  }
}

function viewPost(post: Post) {
  selectedPost.value = post
  showDetailModal.value = true
}

function likePost(post: Post) {
  if (post.liked) {
    post.likes--
    post.liked = false
  } else {
    post.likes++
    post.liked = true
  }
  api.put(`/posts/${post.id}/like`, { liked: post.liked }).catch(() => {
    if (post.liked) {
      post.likes--
      post.liked = false
    } else {
      post.likes++
      post.liked = true
    }
  })
}

async function submitComment() {
  if (!commentForm.content.trim() || !selectedPost.value) return
  
  const newComment: Comment = {
    id: Date.now().toString(),
    authorName: '我',
    content: commentForm.content,
    createdAt: new Date().toISOString().split('T')[0]
  }
  
  selectedPost.value.comments.push(newComment)
  selectedPost.value.commentCount++
  commentForm.content = ''
  
  await api.post(`/posts/${selectedPost.value.id}/comments`, { content: newComment.content }).catch(() => {
    selectedPost.value!.comments.pop()
    selectedPost.value!.commentCount--
  })
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
