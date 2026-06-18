import express from 'express';

const router = express.Router();

interface Resource {
  id: string;
  title: string;
  category: string;
  type: 'book' | 'video' | 'article' | 'course';
  url: string;
  description?: string;
  author?: string;
  rating: number;
  created_at: string;
}

const resources: Resource[] = [
  {
    id: '1',
    title: 'JavaScript: The Good Parts',
    category: 'programming',
    type: 'book',
    url: 'https://example.com/js-good-parts',
    description: '深入讲解JavaScript的优秀特性',
    author: 'Douglas Crockford',
    rating: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'React 官方教程',
    category: 'programming',
    type: 'course',
    url: 'https://react.dev/learn',
    description: 'React官方学习资源',
    author: 'Meta',
    rating: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Python 速成课程',
    category: 'programming',
    type: 'book',
    url: 'https://example.com/python-crash',
    description: '一周内学会Python',
    author: 'Eric Matthes',
    rating: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: '机器学习基础',
    category: 'data science',
    type: 'video',
    url: 'https://example.com/ml-fundamentals',
    description: '机器学习概念入门',
    author: 'Andrew Ng',
    rating: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '5',
    title: '数据结构与算法',
    category: 'programming',
    type: 'course',
    url: 'https://example.com/dsa',
    description: '全面的DSA课程',
    author: 'LeetCode',
    rating: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Web开发训练营',
    category: 'programming',
    type: 'course',
    url: 'https://example.com/web-bootcamp',
    description: '全栈Web开发',
    author: 'Udemy',
    rating: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '7',
    title: '数据科学统计学',
    category: 'data science',
    type: 'book',
    url: 'https://example.com/stats-ds',
    description: '核心统计概念',
    author: 'Peter Bruce',
    rating: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '8',
    title: 'SQL大师班',
    category: 'database',
    type: 'course',
    url: 'https://example.com/sql-masterclass',
    description: '高级SQL技术',
    author: 'DataCamp',
    rating: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: '9',
    title: '操作系统概念',
    category: 'computer science',
    type: 'book',
    url: 'https://example.com/os-concepts',
    description: '操作系统核心原理',
    author: 'Abraham Silberschatz',
    rating: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: '10',
    title: 'AWS云从业者',
    category: 'cloud',
    type: 'course',
    url: 'https://example.com/aws-cloud',
    description: 'AWS认证准备',
    author: 'Amazon',
    rating: 4,
    created_at: new Date().toISOString(),
  },
];

router.get('/', (req, res) => {
  res.json(resources);
});

router.get('/:category', (req, res) => {
  const filtered = resources.filter(r => r.category === req.params.category);
  res.json(filtered);
});

export { router as resourceRouter };
