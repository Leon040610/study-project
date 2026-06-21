import express from 'express';
import { authenticate } from '../middleware/auth';
import { ArrayFileStore } from '../utils/fileStore';

const router = express.Router();

interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  content: string;
  category: string;
  view_count: number;
  comment_count: number;
  likes: number;
  liked_users: string[];
  created_at: string;
  updated_at: string;
}

const postStore = new ArrayFileStore<Post>('posts');
const commentStore = new ArrayFileStore<Comment>('comments');
const posts = postStore.load();
const comments = commentStore.load();

router.get('/', (req, res) => {
  const { category, keyword } = req.query;
  
  let filtered = posts;
  
  if (category) {
    filtered = filtered.filter(p => p.category === category);
  }
  
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(kw) || p.content.toLowerCase().includes(kw)
    );
  }
  
  res.json(filtered);
});

router.post('/', authenticate, (req, res) => {
  const { title, content, category } = req.body;
  
  if (!title || !content || !category) {
    return res.status(400).json({ message: '缺少必填字段' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const post: Post = {
    id,
    user_id: req.user!.id,
    author_name: '用户',
    title,
    content,
    category,
    view_count: 0,
    comment_count: 0,
    likes: 0,
    liked_users: [],
    created_at: now,
    updated_at: now,
  };
  
  posts.push(post);
  postStore.save(posts);
  res.status(201).json(post);
});

router.get('/:id', (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  
  if (!post) {
    return res.status(404).json({ message: '帖子不存在' });
  }
  
  post.view_count++;
  postStore.save(posts);
  
  const postComments = comments.filter(c => c.post_id === post.id);
  
  res.json({
    ...post,
    comments: postComments,
    liked: post.liked_users.includes(req.user?.id || '')
  });
});

router.put('/:id', authenticate, (req, res) => {
  const index = posts.findIndex(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '帖子不存在' });
  }
  
  const { title, content, category } = req.body;
  
  posts[index] = {
    ...posts[index],
    title: title || posts[index].title,
    content: content || posts[index].content,
    category: category || posts[index].category,
    updated_at: new Date().toISOString(),
  };
  postStore.save(posts);
  
  res.json(posts[index]);
});

router.delete('/:id', authenticate, (req, res) => {
  const index = posts.findIndex(p => p.id === req.params.id && p.user_id === req.user?.id);
  
  if (index === -1) {
    return res.status(404).json({ message: '帖子不存在' });
  }
  
  posts.splice(index, 1);
  postStore.save(posts);
  const remainingComments = comments.filter(c => c.post_id !== req.params.id);
  comments.length = 0;
  comments.push(...remainingComments);
  commentStore.save(comments);
  
  res.json({ success: true });
});

router.post('/:id/like', authenticate, (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  
  if (!post) {
    return res.status(404).json({ message: '帖子不存在' });
  }
  
  const userId = req.user!.id;
  const likedIndex = post.liked_users.indexOf(userId);
  
  if (likedIndex === -1) {
    post.liked_users.push(userId);
    post.likes++;
    postStore.save(posts);
    res.json({ liked: true, likes: post.likes });
  } else {
    post.liked_users.splice(likedIndex, 1);
    post.likes--;
    postStore.save(posts);
    res.json({ liked: false, likes: post.likes });
  }
});

router.post('/:id/comments', authenticate, (req, res) => {
  const post = posts.find(p => p.id === req.params.id);
  
  if (!post) {
    return res.status(404).json({ message: '帖子不存在' });
  }
  
  const { content } = req.body;
  
  if (!content) {
    return res.status(400).json({ message: '评论内容不能为空' });
  }
  
  const id = Math.random().toString(36).substring(2, 15);
  const now = new Date().toISOString();
  
  const comment: Comment = {
    id,
    post_id: post.id,
    user_id: req.user!.id,
    author_name: '用户',
    content,
    created_at: now,
  };
  
  comments.push(comment);
  post.comment_count++;
  commentStore.save(comments);
  postStore.save(posts);
  
  res.status(201).json(comment);
});

export { router as postRouter };