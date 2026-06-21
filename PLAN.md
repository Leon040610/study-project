# 三大功能模块修复计划

## 项目背景
- 后端：根目录 `server.js`（运行中，端口 5000，独立 JSON 文件持久化）
- 前端：vue-frontend（端口 5174，vite 代理 `/api` → `http://localhost:5000`）
- 数据存储：`g:\Documents\Study\data.json`
- 资源文件目录：需要新建 `g:\Documents\Study\uploads\`

## 阶段

### 阶段 1：后端 server.js 增强（核心）
- [ ] 资源（resources）模块：CRUD + 文件上传/下载 + 真实数据
- [ ] 帖子（posts）模块：CRUD + 点赞 + 评论 + 浏览统计
- [ ] 提醒（reminders）模块：测试通知端点 + 多渠道模拟 + 调度器

### 阶段 2：前端资源页（Resources.vue）修复
- [ ] 真实数据展示（无后端数据时不再使用硬编码假数据）
- [ ] 资源上传：使用 FormData 上传到 `/api/resources/upload`
- [ ] 资源下载：使用 `/api/resources/:id/download` 触发下载
- [ ] 资源查看：在线预览弹窗

### 阶段 3：前端帖子页（Posts.vue）修复
- [ ] 真实数据展示（无后端数据时不再使用硬编码假数据）
- [ ] 帖子发布：使用真实 user.name 作为 authorName
- [ ] 点赞/评论：调用真实接口

### 阶段 4：前端学习提醒页（Reminders.vue）修复
- [ ] 测试通知按钮：调用 `/reminders/test`
- [ ] 偏好设置：保存到 `/reminders/preferences`
- [ ] 多渠道：邮件 + 推送模拟
- [ ] 规则 CRUD

### 阶段 5：集成测试
- [ ] 多用户登录后数据隔离
- [ ] 上传 → 列表 → 下载 → 查看 完整闭环
- [ ] 发布 → 列表 → 评论 完整闭环
- [ ] 触发测试通知 → 日志中可见

## 关键发现
- 根 `server.js` 中 `tokenUserMap` 在 `app.post('/api/auth/login')` 内被使用，但定义在第 130 行（之后）。需要把定义提前。
- 当前 reminders 接口仅支持 GET/POST，缺少：PUT、DELETE、test、preferences、rules、logs、stats
- 当前无 `/api/posts` 接口，前端会得到 404
- 当前 `/api/resources` 仅支持 GET，缺少 POST/上传/下载
