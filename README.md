# 智能学习计划助手 (Smart Learning Planner)

> 一站式个人学习管理平台，让学习目标、计划、任务井然有序，自动驱动学习进度。

![Vue 3](https://img.shields.io/badge/Vue-3-42b883) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Express](https://img.shields.io/badge/Express-4-000000) ![License](https://img.shields.io/badge/license-MIT-blue)

## 📖 项目简介

**智能学习计划助手** 是一套面向个人学习者与教学场景的全栈 Web 应用。通过「**学习目标 → 学习计划 → 每日任务**」三层级联结构，帮助用户系统化地组织学习过程。任务自动同步到日历视图，每日打卡后自动推进计划进度，进而带动目标达成度，真正实现「学有所循、行有所踪」。

平台内置学习社区（帖子中心）、共享资源管理、自定义提醒规则、个人主页、消息中心等模块，并提供完整的 **管理员后台**（用户管理、日志审计、系统设置、备份恢复、使用指南编辑等）。

## ✨ 核心特性

### 用户端
- 🎯 **目标-计划-任务三级联动**：自定义学习目标，关联多个计划，计划内拆分任务，层层递进
- 📅 **日历视图**：月/周/日多视图，任务自动按计划日期同步，不同优先级彩色标识
- 📊 **自动进度推进**：完成任务自动更新计划进度，计划进度自动聚合到目标进度
- 🔔 **智能提醒**：自定义提醒规则与渠道（站内、邮件），可按计划/任务/目标触发
- 📚 **共享资源**：学习资料上传、下载、分类管理
- 💬 **帖子中心**：学习交流社区（发帖、点赞、评论、审核）
- 👤 **个人中心**：头像、资料、密码自助管理
- 📬 **消息中心**：系统通知、任务/计划/目标进度变化实时推送
- 🌗 **主题切换**：深色/浅色主题
- 📖 **使用指南**：管理员维护的内容，登录后可在首页右上角随时查阅

### 管理端
- 📈 **数据仪表盘**：用户、目标、计划、任务等关键指标
- 👥 **用户管理**：用户列表、角色分配（user/admin）、启停账号、删除
- 📋 **日志审计**：操作日志查看、筛选、导出
- ⚙️ **系统设置**：站点信息、安全策略（Token 有效期、密码强度、注册策略）、SMTP 邮件配置
- 📖 **使用指南编辑**：富文本编辑器（加粗/标题/列表/链接等）+ 实时预览
- 💾 **数据备份恢复**：手动备份、下载、恢复、删除备份

## 🏗️ 技术栈

### 前端（`vue-frontend/`）
| 技术 | 用途 |
|------|------|
| Vue 3 | 渐进式 UI 框架（Composition API） |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具与开发服务器 |
| Element Plus | UI 组件库 |
| Pinia | 状态管理（auth、theme） |
| Vue Router | 路由与角色守卫 |
| Axios | HTTP 客户端（统一封装于 `utils/api.ts`） |
| ECharts | 仪表盘数据可视化 |

### 后端（根目录）
| 技术 | 用途 |
|------|------|
| Node.js + Express 4 | Web 服务框架 |
| JWT (jsonwebtoken) | 身份认证 |
| Multer | 文件上传（头像、资源） |
| Nodemailer | 邮件发送 |
| CORS | 跨域支持 |
| 文件式存储 (data.json) | 轻量数据持久化 |

## 📁 目录结构

```
study-project/
├── server.js                   # 后端入口（Express 应用、API 路由、静态资源）
├── package.json                # 后端依赖与脚本
├── .env                        # 环境变量（JWT 密钥、端口等，不入库）
├── data.json                   # 运行时数据（用户、目标、计划、任务等）
├── data.json.backup-*          # 自动备份
├── backups/                    # 管理员手动备份
├── uploads/                    # 用户上传文件（头像、资源等）
├── vue-frontend/               # 前端工程
│   ├── src/
│   │   ├── views/              # 页面组件
│   │   │   ├── Dashboard.vue
│   │   │   ├── Goals.vue
│   │   │   ├── Plans.vue
│   │   │   ├── Calendar.vue
│   │   │   ├── Reminders.vue
│   │   │   ├── Resources.vue
│   │   │   ├── Posts.vue
│   │   │   ├── Profile.vue
│   │   │   ├── Login.vue
│   │   │   └── admin/          # 管理后台
│   │   │       ├── AdminDashboard.vue
│   │   │       ├── AdminStudents.vue
│   │   │       ├── AdminPlans.vue
│   │   │       ├── AdminResources.vue
│   │   │       ├── AdminPosts.vue
│   │   │       ├── AdminAnnouncements.vue
│   │   │       ├── AdminLogs.vue
│   │   │       └── AdminSettings.vue
│   │   ├── layout/Layout.vue   # 主布局（顶部导航 + 侧边栏）
│   │   ├── components/         # 公共组件
│   │   │   ├── RichTextEditor.vue   # 富文本编辑器
│   │   │   └── UserGuideDialog.vue  # 使用指南对话框
│   │   ├── router/             # 路由配置（含角色守卫）
│   │   ├── stores/             # Pinia 状态（auth、theme）
│   │   ├── utils/              # 工具（api 封装、权限工具）
│   │   └── App.vue
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js ≥ 18
- npm ≥ 9
- 现代浏览器（Chrome / Edge / Firefox）

### 1. 克隆仓库
```bash
git clone https://github.com/Leon040610/study-project.git
cd study-project
```

### 2. 安装依赖
```bash
# 后端
npm install

# 前端
cd vue-frontend
npm install
cd ..
```

### 3. 配置环境变量（可选）
后端默认监听 `3000` 端口，使用内置 JWT 密钥。如需自定义：
```bash
# 根目录创建 .env
PORT=3000
JWT_SECRET=your-secret-key-here
```

### 4. 启动开发服务
```bash
# 终端 1：后端（http://localhost:3000）
npm run dev:server

# 终端 2：前端（http://localhost:5173）
npm run dev:client
```

访问 http://localhost:5173 ，前端通过 Vite 代理自动转发 `/api` 请求到后端 3000 端口。

### 5. 生产构建
```bash
# 构建前端到 vue-frontend/dist
npm run build:client

# 启动后端（也可同时托管前端静态文件）
npm start
```

### 6. 第一个管理员账号
首次启动后注册的第一个账号默认为 `user` 角色。通过 `data.json` 中将该用户 `role` 改为 `admin` 即可获得后台访问权限。

## 📚 使用流程

1. **创建学习目标**：在「学习目标」页新建目标（如"3 个月通过英语四级"）
2. **创建学习计划**：在「学习计划」页新建计划，关联已创建的目标
3. **添加任务**：进入计划详情，添加具体任务并设置计划日期
4. **日历查看**：任务自动同步到「日历视图」，按日完成打卡
5. **进度自动推进**：完成任务 → 计划进度自动累加 → 目标进度自动聚合
6. **实时通知**：进度变化、提醒触发自动推送至「消息中心」

## 🗺️ API 概览

后端共提供 **80+ REST 端点**，按模块组织：

| 模块 | 路径前缀 | 典型端点 |
|------|----------|----------|
| 认证 | `/api/auth` | `register`、`login`、`profile`、`avatar`、`change-password`、`captcha` |
| 学习目标 | `/api/goals` | `GET/POST/PUT/DELETE /api/goals` |
| 学习计划 | `/api/plans` | `GET/POST/PUT/DELETE /api/plans`、`/api/plans/:id` |
| 任务 | `/api/tasks` | `GET/POST/PUT/DELETE /api/tasks` |
| 日历/通知 | `/api/notifications`、`/api/announcements` | 消息与公告管理 |
| 资源 | `/api/resources` | 分类、上传、下载 |
| 帖子 | `/api/posts` | 列表、详情、点赞、评论 |
| 提醒 | `/api/reminders` | 规则、偏好、触发、日志、统计、测试 |
| 管理后台 | `/api/admin` | 用户、日志、设置、备份、指南（部分需 `requireAdmin`） |
| 公开 | `/api/guide`、`/api/settings/public` | 用户可见的使用指南与公开设置 |

> 完整接口细节请参考 `server.js` 中各 `app.get/post/put/delete` 定义。

## 🔐 权限模型

- **`user`（默认）**：访问所有用户端页面 + 自身数据
- **`admin`**：拥有 `user` 全部权限 + 管理后台入口
- 路由守卫在 `vue-frontend/src/router/index.ts` 中实现
- 后端关键写操作通过 `requireAdmin` 中间件拦截

## 🛠️ 常见操作

### 重置数据
```bash
# 停止后端后删除数据文件，重启后自动以空数据初始化
del data.json
npm run dev:server
```

### 查看运行日志
后端将关键操作写入 `adminLogs`，可通过管理后台「日志审计」页面查看、筛选、导出 CSV。

### 备份与恢复
通过管理后台「系统设置」或 `/api/admin/backup` 系列 API 操作；备份文件存储于 `backups/` 目录。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

提交信息推荐遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范（`feat:` / `fix:` / `refactor:` / `docs:` 等）。

## 📝 许可证

本项目使用 MIT 许可证。详见 LICENSE 文件。

## 📮 联系方式

如有问题或建议，请通过 GitHub Issues 提交。
